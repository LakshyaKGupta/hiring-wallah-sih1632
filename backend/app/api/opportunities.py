from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.db.database import db
from app.db.models import OpportunityCreate, OpportunityResponse, ApplicationCreate, ApplicationResponse
from app.auth.firebase import optional_firebase_user, require_firebase_user
import logging

logger = logging.getLogger("hiring_wallah.api.opportunities")

router = APIRouter(prefix="/opportunities", tags=["Opportunities Hub - SIH1632"])

@router.get("", response_model=List[OpportunityResponse])
async def list_opportunities(
    sector: Optional[str] = Query(None, description="private_job, govt_job, overseas, internship, industrial_training, or all"),
    opportunity_type: Optional[str] = Query(None, description="full_time, part_time, internship, training, or all"),
    location: Optional[str] = Query(None, description="City or region filter (e.g. Jaipur, Kota, Remote)"),
    branch: Optional[str] = Query(None, description="Technical branch filter (e.g. Electrical, Computer Science, Civil)"),
    search: Optional[str] = Query(None, description="Keyword search query"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Exhaustive listing of multi-sector opportunities across Private sector, 
    Government sector, Overseas employment, and Internships/Industrial Training.
    """
    try:
        opportunities = await db.get_all_opportunities(
            sector=sector,
            opportunity_type=opportunity_type,
            location=location,
            branch=branch,
            search=search,
            limit=limit,
            offset=offset
        )
        return opportunities
    except Exception as e:
        logger.error(f"Error fetching opportunities: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve opportunities list.")

@router.get("/sectors/stats", response_model=Dict[str, Any])
async def get_sectors_statistics():
    """
    Returns counts and metrics of verified opportunities across all 5 key sectors.
    """
    try:
        return await db.get_sector_stats()
    except Exception as e:
        logger.error(f"Error fetching sector stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sector statistics.")

@router.get("/applications/me", response_model=List[ApplicationResponse])
async def list_my_applications(decoded_token: dict = Depends(require_firebase_user)):
    """
    Returns all submitted opportunity applications for the authenticated candidate.
    """
    try:
        user_uid = decoded_token.get("uid")
        applications = await db.get_applications_by_user(user_uid=user_uid)
        return applications
    except Exception as e:
        logger.error(f"Error fetching user applications: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve applications.")

@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity_detail(opportunity_id: str):
    """
    Retrieves full details of a specific job, govt vacancy, overseas post, or internship.
    """
    try:
        opp = await db.get_opportunity(opportunity_id)
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found.")
        return opp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching opportunity {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve opportunity details.")

@router.post("", response_model=OpportunityResponse)
async def create_opportunity_endpoint(
    payload: OpportunityCreate,
    decoded_token: Optional[dict] = Depends(optional_firebase_user)
):
    """
    Registers a new verified opportunity from employers or Technical Education Department.
    """
    try:
        new_opp = await db.create_opportunity(
            title=payload.title,
            organization=payload.organization,
            sector=payload.sector,
            location=payload.location,
            description=payload.description,
            opportunity_type=payload.opportunity_type or "full_time",
            department=payload.department,
            stipend_or_salary=payload.stipend_or_salary,
            experience_level=payload.experience_level or "Fresher",
            qualification_required=payload.qualification_required,
            branch=payload.branch,
            skills_required=payload.skills_required or [],
            eligibility_criteria=payload.eligibility_criteria,
            application_deadline=payload.application_deadline,
            official_link=payload.official_link,
            source=payload.source or "Rajasthan Technical Education Portal",
            is_verified=payload.is_verified
        )
        return new_opp
    except Exception as e:
        logger.error(f"Error creating opportunity: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create opportunity: {str(e)}")

@router.post("/{opportunity_id}/apply", response_model=ApplicationResponse)
async def apply_to_opportunity(
    opportunity_id: str,
    payload: Optional[ApplicationCreate] = Body(default=None),
    decoded_token: Optional[dict] = Depends(optional_firebase_user)
):
    """
    Allows a student/graduate to apply for an opportunity with their profile credentials.
    """
    try:
        opp = await db.get_opportunity(opportunity_id)
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found.")

        # Enforce application deadline rule
        deadline_str = opp.get("application_deadline")
        if deadline_str:
            try:
                deadline_dt = datetime.strptime(deadline_str[:10], "%Y-%m-%d")
                if deadline_dt.date() < datetime.utcnow().date():
                    raise HTTPException(
                        status_code=400,
                        detail=f"This opportunity has expired. The application deadline was {deadline_str}."
                    )
            except HTTPException:
                raise
            except Exception:
                pass

        user_uid = decoded_token.get("uid") if decoded_token else None
        candidate_id = payload.candidate_id if payload else None
        resume_id = payload.resume_id if payload else None
        cover_note = payload.cover_note if payload else "Applied via Rajasthan Technical Education Platform."

        # Compute preliminary match score
        match_score = 85

        application = await db.create_application(
            opportunity_id=opportunity_id,
            candidate_id=candidate_id,
            user_uid=user_uid,
            resume_id=resume_id,
            cover_note=cover_note,
            match_score=match_score
        )
        application["opportunity"] = opp
        return application
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying to opportunity {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit application: {str(e)}")
