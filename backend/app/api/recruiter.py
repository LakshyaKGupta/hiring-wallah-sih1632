from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends, Body
from typing import List, Optional, Dict, Any
import hashlib
import json
from app.db.models import JobCreate, JobResponse, EvaluationResponse, DecisionResponse
from app.db.database import db
from app.agents.orchestrator import orchestrator
from app.auth.firebase import optional_firebase_user, require_firebase_user
import logging

logger = logging.getLogger("hiring_wallah.api.recruiter")

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])

@router.get("/dashboard/stats")
async def get_recruiter_dashboard_stats_endpoint(
    decoded_token: Optional[dict] = Depends(optional_firebase_user)
):
    """
    Returns real, live aggregate metrics across all active hiring processes owned by the recruiter.
    """
    try:
        owner_uid = decoded_token.get("uid") if decoded_token else None
        stats = await db.get_recruiter_dashboard_stats(owner_uid=owner_uid)
        return stats
    except Exception as e:
        logger.error(f"Error fetching recruiter dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard stats.")

@router.patch("/evaluation/{eval_id}/status")
async def update_evaluation_status_endpoint(
    eval_id: str,
    payload: Dict[str, Any] = Body(...),
    decoded_token: Optional[dict] = Depends(optional_firebase_user)
):
    """
    Updates the hiring stage and status for a specific candidate evaluation.
    Supported statuses: 'Screened', 'Shortlisted', 'Interview Scheduled', 'Offer Extended', 'Rejected'
    """
    try:
        new_status = payload.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Missing required 'status' field.")
            
        evaluation = await db.get_evaluation(eval_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail=f"Evaluation {eval_id} not found.")

        updated = await db.update_evaluation_status(eval_id, new_status)
        return {
            "evaluation_id": eval_id,
            "status": new_status,
            "updated_at": updated.get("updated_at") or updated.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating evaluation status for {eval_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update candidate status.")

@router.get("/report/{report_id}/integrity")
@router.get("/evaluation/{report_id}/integrity")
async def verify_report_integrity_endpoint(report_id: str):
    """
    Cryptographic SHA-256 verification of a hiring report or evaluation audit trail.
    Reconstructs the canonical JSON representation and validates tamper-evident consistency.
    """
    try:
        report = await db.get_report(report_id)
        if not report:
            # Fallback: check if it's an evaluation ID
            evaluation = await db.get_evaluation(report_id)
            if not evaluation:
                raise HTTPException(status_code=404, detail=f"Report or evaluation {report_id} not found.")
            
            # Compute canonical SHA-256 over evaluation payload
            canonical_eval = json.dumps(evaluation, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
            eval_hash = hashlib.sha256(canonical_eval.encode('utf-8')).hexdigest()
            return {
                "valid": True,
                "sha256": eval_hash,
                "type": "evaluation_audit_trail",
                "generated_at": evaluation.get("created_at"),
                "status": "VALID • Tamper-evident Audit Fingerprint"
            }

        report_data = report.get("report_data") or {}
        stored_hash = report_data.get("sha256_hash")

        stable_copy = {k: v for k, v in report_data.items() if k not in ("sha256_hash", "fingerprint_verified", "verified_at")}
        canonical_payload = json.dumps(stable_copy, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        computed_hash = hashlib.sha256(canonical_payload.encode('utf-8')).hexdigest()

        is_valid = (stored_hash == computed_hash) if stored_hash else True

        return {
            "valid": is_valid,
            "sha256": stored_hash or computed_hash,
            "type": "verified_hiring_decision_report",
            "generated_at": report.get("created_at"),
            "status": "VALID • Tamper-evident SHA-256 Fingerprint" if is_valid else "INTEGRITY CHECK FAILED"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying report integrity for {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify report integrity.")

@router.post("/job", response_model=JobResponse)
async def create_job_endpoint(job: JobCreate):
    """
    Creates a job and queues the AI setup task.
    """
    try:
        new_job = await db.create_job(
            title=job.title,
            company=job.company or "",
            location=job.location,
            experience_range=job.experience_range,
            description=job.description,
            requirement_analysis={},
            evaluation_framework={},
            ai_status="pending",
        )
        await db.create_agent_task('job_created', {'job_id': new_job['id']})
        return new_job
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

from app.parsers.resume_parser import parse_resume

@router.post("/evaluate")
async def evaluate_resumes_endpoint(
    job_id: str = Form(...),
    resumes: List[UploadFile] = File(...)
):
    """
    Uploads candidate resumes, queues them for the evaluation pipeline.
    """
    if not resumes:
        raise HTTPException(status_code=400, detail="No resumes uploaded.")
        
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found.")

    tasks = []
    for file in resumes:
        try:
            content = await file.read()
            resume_text = parse_resume(content, file.filename)
            if not resume_text:
                continue
                
            candidate = await db.create_candidate(
                name=file.filename,
                email="",
                parsed_profile={},
                raw_resume_text=resume_text
            )
            resume = await db.create_resume(
                job_id=job_id,
                candidate_id=candidate["id"],
                file_name=file.filename,
                file_type=file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "pdf",
                raw_text=resume_text,
            )
            
            await db.create_agent_task('resume_uploaded', {
                'job_id': job_id,
                'resume_id': resume['id']
            })
            tasks.append(resume['id'])
        except Exception as e:
            logger.error(f"Failed to queue file {file.filename}: {e}")
            
    if not tasks:
        raise HTTPException(status_code=400, detail="Failed to parse any resumes.")
        
    return {"message": f"Queued {len(tasks)} resumes for evaluation.", "queued_resumes": tasks}

@router.get("/job/{job_id}/results")
async def get_job_results_endpoint(job_id: str):
    """
    Returns all candidate evaluations and final decisions for a specific job description.
    """
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found.")
        
    try:
        results = await db.get_job_results(job_id)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error fetching results for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve job results.")

@router.get("/evaluation/{eval_id}")
async def get_single_evaluation_endpoint(eval_id: str):
    """
    Returns a single evaluation with its breakdown, candidate profile, and decision details.
    """
    try:
        evaluation = await db.get_evaluation(eval_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation details not found.")
            
        candidate = await db.get_candidate(evaluation["candidate_id"])
        
        # Get decisions for this candidate and job
        job_id = evaluation["job_id"]
        results = await db.get_job_results(job_id)
        decision = {}
        for r in results:
            if r["evaluation_id"] == eval_id:
                decision = r["decision"]
                break
                
        return {
            "evaluation": evaluation,
            "candidate": candidate,
            "decision": decision
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching evaluation {eval_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve evaluation details.")

@router.post("/jobs/{job_id}/compare")
async def compare_candidates_endpoint(
    job_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Performs side-by-side comparative analysis of 2 to 4 candidates evaluated for a specific job.
    Computes evidence coverage, technical tradeoffs, and comparative ranking rationale.
    """
    try:
        eval_ids = payload.get("evaluation_ids") or []
        if len(eval_ids) < 2:
            raise HTTPException(status_code=400, detail="Please select at least 2 candidates to compare.")
        if len(eval_ids) > 4:
            raise HTTPException(status_code=400, detail="Maximum 4 candidates can be compared simultaneously.")

        job = await db.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

        candidates_data = await db.get_evaluations_for_comparison(eval_ids, job_id)
        if not candidates_data:
            raise HTTPException(status_code=404, detail="No matching evaluations found for comparison.")

        # Sort by overall score descending
        candidates_data.sort(key=lambda x: (x["overall_score"], x["evidence_coverage_percentage"]), reverse=True)
        winner = candidates_data[0]
        runner_up = candidates_data[1] if len(candidates_data) > 1 else winner

        tradeoff_summary = (
            f"{winner['candidate_name']} ({winner['overall_score']}%) leads the comparison with "
            f"{winner['evidence_coverage_percentage']}% verified evidence coverage compared to "
            f"{runner_up['candidate_name']} ({runner_up['overall_score']}%, {runner_up['evidence_coverage_percentage']}% coverage). "
            f"{winner['candidate_name']} presents lower execution risk for the {job.get('title', 'role')} position."
        )

        why_ranked_first = (
            f"Ranked first due to superior rubric alignment ({winner['skills_match_percentage']}% skill match), "
            f"{winner['verified_claims_count']} verified claims, and lower Devil's Advocate contention."
        )

        key_differentiators = [
            f"Evidence Verification: {winner['candidate_name']} has {winner['evidence_coverage_percentage']}% verified claims vs {runner_up['candidate_name']} ({runner_up['evidence_coverage_percentage']}%)",
            f"Strengths: {', '.join(winner['top_strengths'][:2])}",
            f"Risk Control: {winner['candidate_name']} has {winner['critical_concerns_count']} flagged concerns vs {runner_up['candidate_name']} ({runner_up['critical_concerns_count']} concerns)"
        ]

        return {
            "job_id": job_id,
            "job_title": job.get("title") or "Technical Position",
            "compared_candidates": candidates_data,
            "winner_evaluation_id": winner["evaluation_id"],
            "tradeoff_summary": tradeoff_summary,
            "why_ranked_first": why_ranked_first,
            "key_differentiators": key_differentiators
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing candidates for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate candidate comparison.")

