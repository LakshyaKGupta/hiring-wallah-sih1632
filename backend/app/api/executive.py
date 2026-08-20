from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.db.database import db
import logging

logger = logging.getLogger("hiring_wallah.api.executive")

router = APIRouter(prefix="/executive", tags=["Executive Dashboard"])

@router.get("/metrics", response_model=Dict[str, Any])
async def get_executive_metrics():
    """
    Returns high-level funnel metrics and AI performance metrics.
    """
    try:
        # These queries would normally be proper aggregations, 
        # but we'll return mocked/simple calculations for demonstration.
        
        # 1. Pipeline Funnel
        conn = db._connect_sqlite()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM resumes")
        total_resumes = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM evaluations WHERE status='completed'")
        total_evaluations = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM decisions WHERE verdict='Strong Hire' OR verdict='Hire'")
        total_shortlisted = cur.fetchone()[0]
        
        # 2. AI Performance
        cur.execute("SELECT COUNT(*) FROM learning_events WHERE difference > 0")
        total_overrides = cur.fetchone()[0]
        
        override_rate = (total_overrides / total_evaluations * 100) if total_evaluations > 0 else 0
        agreement_rate = 100 - override_rate
        
        conn.close()
        
        return {
            "funnel": {
                "resumes_uploaded": total_resumes,
                "resumes_evaluated": total_evaluations,
                "candidates_shortlisted": total_shortlisted,
                "candidates_hired": 0 # Placeholder
            },
            "ai_performance": {
                "human_agreement_rate": round(agreement_rate, 2),
                "override_rate": round(override_rate, 2),
                "total_overrides_learned": total_overrides
            }
        }
    except Exception as e:
        logger.error(f"Failed to fetch executive metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch metrics.")
