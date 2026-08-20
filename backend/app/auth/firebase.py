import json
import logging
import time
from functools import lru_cache
from typing import Any, Dict, Optional

import jwt
from fastapi import Header, HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token

from app.config import settings

FIREBASE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
logger = logging.getLogger("hiring_wallah.auth.firebase")


@lru_cache(maxsize=1)
def _firebase_admin_auth():
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        from firebase_admin import credentials
    except ImportError as exc:
        raise RuntimeError("firebase-admin is not installed in the backend environment.") from exc

    if not firebase_admin._apps:
        if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            cred = credentials.Certificate(json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON))
            firebase_admin.initialize_app(cred)
        elif settings.FIREBASE_SERVICE_ACCOUNT_PATH:
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID or None})

    return firebase_auth


@lru_cache(maxsize=1)
def _firebase_jwks_client():
    return jwt.PyJWKClient(FIREBASE_JWKS_URL)


def _verify_with_public_keys(token: str) -> Dict[str, Any]:
    project_id = settings.FIREBASE_PROJECT_ID
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID is not configured.")

    signing_key = _firebase_jwks_client().get_signing_key_from_jwt(token)
    decoded = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=project_id,
        issuer=f"https://securetoken.google.com/{project_id}",
    )
    decoded["uid"] = decoded.get("sub")
    return decoded


@lru_cache(maxsize=1)
def _google_auth_request():
    return requests.Request()


def _verify_with_google_auth(token: str) -> Dict[str, Any]:
    decoded = id_token.verify_firebase_token(
        token,
        _google_auth_request(),
        audience=settings.FIREBASE_PROJECT_ID,
        clock_skew_in_seconds=30,
    )
    decoded["uid"] = decoded.get("sub")
    return decoded


def _verify_local_claims_only(token: str, previous_error: Exception) -> Dict[str, Any]:
    cors_is_local = any(
        origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1")
        for origin in settings.cors_origins_list
    )
    if not settings.FIREBASE_ALLOW_LOCAL_TOKEN_FALLBACK or not cors_is_local:
        raise previous_error

    decoded = jwt.decode(
        token,
        options={
            "verify_signature": False,
            "verify_aud": False,
            "verify_iss": False,
        },
    )
    project_id = settings.FIREBASE_PROJECT_ID
    expected_issuer = f"https://securetoken.google.com/{project_id}"
    now = int(time.time())

    if decoded.get("aud") != project_id:
        raise ValueError("Firebase token audience does not match this project.")
    if decoded.get("iss") != expected_issuer:
        raise ValueError("Firebase token issuer does not match this project.")
    if not decoded.get("sub"):
        raise ValueError("Firebase token subject is missing.")
    if int(decoded.get("exp", 0)) <= now:
        raise ValueError("Firebase token is expired.")
    if int(decoded.get("iat", 0)) > now + 60:
        raise ValueError("Firebase token was issued in the future.")

    logger.warning(
        "Using localhost Firebase claim-validation fallback after public verification failed: %s",
        previous_error.__class__.__name__,
    )
    decoded["uid"] = decoded["sub"]
    return decoded


def verify_firebase_token(token: str) -> Dict[str, Any]:
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON or settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        firebase_auth = _firebase_admin_auth()
        return firebase_auth.verify_id_token(token)

    errors: list[Exception] = []
    for verifier in (_verify_with_google_auth, _verify_with_public_keys):
        try:
            return verifier(token)
        except Exception as exc:
            errors.append(exc)
            logger.warning("Firebase public token verification failed via %s: %s", verifier.__name__, exc.__class__.__name__)

    return _verify_local_claims_only(token, errors[-1])


async def require_firebase_user(authorization: str = Header(default="")) -> Dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Firebase bearer token.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Firebase bearer token.",
        )

    try:
        return verify_firebase_token(token)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.warning("Firebase token rejected: %s", exc.__class__.__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token for Hiring Wallah. Sign out, refresh, and sign in again.",
        ) from exc


async def optional_firebase_user(authorization: str = Header(default="")) -> Optional[Dict[str, Any]]:
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        return None
    try:
        return verify_firebase_token(token)
    except Exception:
        return None

