from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.db.database import db
from app.agents.orchestrator import orchestrator
import logging

logger = logging.getLogger("hiring_wallah.api.simulation")

router = APIRouter(prefix="/simulation", tags=["Simulation"])

class WeightSimulationRequest(BaseModel):
    job_id: str
    weights: Dict[str, int] # e.g. {"Role Fit": 50, "Execution Evidence": 25, "Risk Control": 25}

@router.post("/weights")
async def simulate_weights(request: WeightSimulationRequest):
    """
    Simulates a different set of evaluation weights to re-rank candidates without re-running AI extraction.
    """
    try:
        job = await db.get_job(request.job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # In a real system, this would apply the weights to the raw evidence scores 
        # and re-calculate the overall score.
        # For this prototype, we'll fetch existing results and sort them 
        # based on a pseudo-calculation using the new weights.
        
        results = await db.get_job_results(request.job_id)
        
        # Pseudo-re-ranking logic for demonstration:
        # We assume the AI scored each dimension 0-100.
        for res in results:
            breakdown = res["evaluation"].get("breakdown", {})
            new_score_sum = 0
            total_weight = 0
            for dimension, new_weight in request.weights.items():
                dim_score = breakdown.get(dimension, {}).get("score", 0)
                new_score_sum += dim_score * new_weight
                total_weight += new_weight
                
            if total_weight > 0:
                res["evaluation"]["score"] = round(new_score_sum / total_weight)
                
        # Re-sort using same logic as orchestrator
        verdict_weights = {"Strong Hire": 3, "Consider": 2, "Reject": 1}
        def _get_sort_key(res):
            verdict = res["decision"].get("verdict", "Reject")
            score = res["evaluation"].get("score", 0)
            confidence = res["decision"].get("confidence", 0)
            evidence_count = len(res["evaluation"].get("evidence_items") or res["evaluation"].get("evidence") or [])
            return (verdict_weights.get(verdict, 1), score, confidence, evidence_count)
            
        results_sorted = sorted(results, key=_get_sort_key, reverse=True)
        
        # Return the newly sorted candidates without committing to the main DB rankings
        return {"simulated_results": results_sorted}
        
    except Exception as e:
        logger.error(f"Failed to simulate weights: {e}")
        raise HTTPException(status_code=500, detail="Failed to run simulation.")
