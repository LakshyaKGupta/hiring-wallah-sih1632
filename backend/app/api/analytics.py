from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.db.database import db
from app.db.models import GovernmentAnalyticsResponse
import logging

logger = logging.getLogger("hiring_wallah.api.analytics")

router = APIRouter(prefix="/analytics", tags=["Technical Education Analytics - SIH1632"])

@router.get("/technical-education", response_model=GovernmentAnalyticsResponse)
async def get_technical_education_department_analytics():
    """
    Returns state-wide analytical intelligence for the Technical Education Department, Govt. of Rajasthan:
    - Multi-sector opportunity distribution (Private, Govt, Overseas, Internships, Industrial Training)
    - Branch-wise skill demand index across Rajasthan engineering and polytechnic colleges
    - Regional hubs and institutional coverage (Jaipur, Jodhpur, Kota, Udaipur, Bikaner, Ajmer)
    - Employability readiness index and skill-gap closure rates
    """
    try:
        analytics = await db.get_technical_education_analytics()
        return analytics
    except Exception as e:
        logger.error(f"Error generating technical education analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve Technical Education analytics.")
