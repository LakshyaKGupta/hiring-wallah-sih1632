from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from app.db.database import db
from app.db.models import (
    MentorResponse,
    MentorshipRequestCreate,
    MentorshipRequestResponse
)
from app.auth.firebase import optional_firebase_user, require_firebase_user
import logging

logger = logging.getLogger("hiring_wallah.api.mentorship")

router = APIRouter(prefix="/mentorship", tags=["Industry & Alumni Mentorship Programs - SIH1632"])

@router.get("/mentors", response_model=List[MentorResponse])
async def list_mentors(
    industry: Optional[str] = Query(None, description="Filter by industry domain (e.g. Power, AI, IoT, Public Sector)"),
    alumni_institution: Optional[str] = Query(None, description="Filter by Rajasthan institution (e.g. RTU Kota, MBM, CTAE)")
):
    """
    Lists verified industry mentors and Rajasthan alumni available for student guidance.
    """
    try:
        mentors = await db.get_all_mentors(industry=industry, alumni_institution=alumni_institution)
        return mentors
    except Exception as e:
        logger.error(f"Error listing mentors: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve mentors.")

@router.get("/mentors/{mentor_id}", response_model=MentorResponse)
async def get_mentor_endpoint(mentor_id: str):
    """
    Retrieves full profile of a specific mentor.
    """
    try:
        mentor = await db.get_mentor(mentor_id)
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found.")
        return mentor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mentor {mentor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve mentor.")

@router.post("/request", response_model=MentorshipRequestResponse)
async def create_mentorship_request_endpoint(
    payload: MentorshipRequestCreate,
    decoded_token: Optional[dict] = Depends(optional_firebase_user)
):
    """
    Allows a student to apply for mentorship pairing with an industry leader or alumnus.
    """
    try:
        mentor = await db.get_mentor(payload.mentor_id)
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found.")

        user_uid = decoded_token.get("uid") if decoded_token else None

        req = await db.create_mentorship_request(
            mentor_id=payload.mentor_id,
            career_goals=payload.career_goals,
            candidate_id=payload.candidate_id,
            user_uid=user_uid,
            technical_interests=payload.technical_interests or []
        )
        return req
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mentorship request: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit mentorship request: {str(e)}")

@router.get("/my-requests", response_model=List[MentorshipRequestResponse])
async def list_my_mentorship_requests(decoded_token: dict = Depends(require_firebase_user)):
    """
    Retrieves all mentorship applications for the authenticated student.
    """
    try:
        user_uid = decoded_token.get("uid")
        requests = await db.get_mentorship_requests(user_uid=user_uid)
        return requests
    except Exception as e:
        logger.error(f"Error listing user mentorship requests: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve mentorship requests.")
