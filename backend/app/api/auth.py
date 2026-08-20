from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.firebase import require_firebase_user
from app.db.database import db
from app.db.models import UserProfileResponse, UserProfileUpsert, UserProfileUpdate

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(decoded_token: dict = Depends(require_firebase_user)):
    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token.")

    profile = await db.get_user_profile(firebase_uid)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile has not been created.")
    return profile

@router.post("/profile", response_model=UserProfileResponse)
async def upsert_profile(
    payload: UserProfileUpsert,
    decoded_token: dict = Depends(require_firebase_user),
):
    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token.")

    return await db.upsert_user_profile(
        firebase_uid=firebase_uid,
        email=decoded_token.get("email"),
        display_name=payload.display_name or decoded_token.get("name"),
        photo_url=decoded_token.get("picture"),
        role=payload.role,
        company_name=payload.company_name,
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    payload: UserProfileUpdate,
    decoded_token: dict = Depends(require_firebase_user),
):
    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token.")

    # Check if username is taken
    if payload.username:
        existing = await db.get_user_by_username(payload.username)
        if existing and existing["firebase_uid"] != firebase_uid:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken.")

    return await db.update_user_profile(
        firebase_uid=firebase_uid,
        display_name=payload.display_name,
        photo_url=payload.photo_url,
        username=payload.username,
        company_name=payload.company_name,
    )
