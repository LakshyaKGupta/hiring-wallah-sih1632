from fastapi import APIRouter, HTTPException
from app.db.models import FeedbackOverrideRequest, LearningEventResponse
from app.db.database import db
import logging
from typing import List, Dict, Any

logger = logging.getLogger("hiring_wallah.api.learning")

router = APIRouter(prefix="/learning", tags=["Learning & Feedback"])

@router.post("/override", response_model=LearningEventResponse)
async def submit_learning_override(request: FeedbackOverrideRequest):
    """
    Submits a recruiter override event (e.g. AI ranked a candidate 5th, but Human ranked 2nd).
    Requires a detailed reason for the difference to train future iterations.
    """
    try:
        # Check if job and candidate exist
        job = await db.get_job(request.job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
            
        event_id = await db.create_learning_event(
            job_id=request.job_id,
            candidate_id=request.candidate_id,
            ai_rank=request.ai_rank,
            human_rank=request.human_rank,
            feedback_reason=request.feedback_reason
        )
        
        # We fetch the created event (in a real app we'd fetch it, but here we construct response)
        return LearningEventResponse(
            id=event_id,
            job_id=request.job_id,
            candidate_id=request.candidate_id,
            ai_rank=request.ai_rank,
            human_rank=request.human_rank,
            difference=abs(request.ai_rank - request.human_rank),
            feedback_reason=request.feedback_reason,
            created_at=str(datetime.utcnow()) # This is a placeholder since we don't query it back immediately
        )
    except Exception as e:
        logger.error(f"Failed to submit learning override: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

@router.get("/admin/failures", response_model=List[Dict[str, Any]])
async def get_failure_analysis():
    """
    Returns aggregated failure analysis indicating where the AI commonly disagrees with recruiters.
    """
    try:
        analysis = await db.get_failure_analysis()
        return analysis
    except Exception as e:
        logger.error(f"Failed to get failure analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch failure analysis data.")
