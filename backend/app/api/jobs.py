from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from typing import List
from app.db.models import JobCreate, JobResponse
from app.db.database import db
from app.agents.orchestrator import orchestrator
from app.auth.firebase import require_firebase_user
from app.config import settings
from app.parsers.resume_parser import parse_resume
import logging

logger = logging.getLogger("hiring_wallah.api.jobs")

router = APIRouter(prefix="/jobs", tags=["Jobs"])

async def _require_recruiter(decoded_token: dict) -> dict:
    profile = await db.get_user_profile(decoded_token["uid"])
    if not profile or profile.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Recruiter role is required.")
    return profile


@router.get("", response_model=List[JobResponse])
async def list_jobs_endpoint(decoded_token: dict = Depends(require_firebase_user)):
    """
    Returns a list of all jobs configured in the database, including their evaluation criteria.
    """
    try:
        await _require_recruiter(decoded_token)
        jobs = await db.get_all_jobs(owner_uid=decoded_token["uid"])
        return jobs
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve jobs list.")

@router.post("", response_model=JobResponse)
async def create_simple_job_endpoint(job: JobCreate, decoded_token: dict = Depends(require_firebase_user)):
    """
    Manually creates a new job profile and triggers its evaluation framework setup.
    """
    try:
        profile = await db.get_user_profile(decoded_token["uid"])
        if not profile or profile.get("role") != "recruiter":
            raise HTTPException(status_code=403, detail="Recruiter role is required to create jobs.")

        new_job = await orchestrator.run_job_setup(
            title=job.title,
            company=job.company or "",
            location=job.location,
            experience_range=job.experience_range,
            description=job.description,
            owner_uid=decoded_token["uid"],
            company_id=profile.get("company_id"),
        )
        return new_job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_endpoint(job_id: str, decoded_token: dict = Depends(require_firebase_user)):
    await _require_recruiter(decoded_token)
    job = await db.get_job(job_id)
    if not job or job.get("owner_uid") != decoded_token["uid"]:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@router.get("/{job_id}/resumes")
async def list_job_resumes_endpoint(job_id: str, decoded_token: dict = Depends(require_firebase_user)):
    await get_job_endpoint(job_id, decoded_token)
    return {"resumes": await db.get_job_resumes(job_id)}


@router.post("/{job_id}/resumes")
async def upload_job_resumes_endpoint(
    job_id: str,
    files: List[UploadFile] = File(...),
    decoded_token: dict = Depends(require_firebase_user),
):
    await get_job_endpoint(job_id, decoded_token)
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one resume.")
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Upload a maximum of 20 resumes at once.")

    allowed = {"pdf", "docx", "txt"}
    invalid = [file.filename for file in files if (file.filename or "").rsplit(".", 1)[-1].lower() not in allowed]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unsupported files: {', '.join(invalid)}")

    parsed = []
    for file in files:
        content = await file.read()
        filename = file.filename or "resume.txt"
        text = parse_resume(content, filename)
        if not text:
            continue
            
        candidate = await db.create_candidate(
            name=filename.rsplit(".", 1)[0],
            email="",
            parsed_profile={"source": "resume_upload", "filename": filename},
            raw_resume_text=text,
        )
        resume = await db.create_resume(
            job_id=job_id,
            candidate_id=candidate["id"],
            file_name=filename,
            file_type=filename.rsplit(".", 1)[-1].lower(),
            raw_text=text,
            parse_status="parsed",
        )
        parsed.append({"candidate": candidate, "resume": resume})
        
        # Queue the resume for evaluation
        if settings.GEMINI_API_KEY:
            await db.create_agent_task('resume_uploaded', {
                'job_id': job_id,
                'resume_id': resume['id']
            })

    return {
        "parsed": parsed,
        "results": [],
        "evaluation_available": bool(settings.GEMINI_API_KEY),
        "message": f"Queued {len(parsed)} resumes for evaluation." if settings.GEMINI_API_KEY else "Evaluation unavailable. Configure AI provider.",
    }


@router.get("/{job_id}/evaluations")
async def list_job_evaluations_endpoint(job_id: str, decoded_token: dict = Depends(require_firebase_user)):
    await get_job_endpoint(job_id, decoded_token)
    return {"results": await db.get_job_results(job_id)}


@router.get("/{job_id}/reports")
async def list_job_reports_endpoint(job_id: str, decoded_token: dict = Depends(require_firebase_user)):
    await get_job_endpoint(job_id, decoded_token)
    return {"reports": await db.get_job_reports(job_id)}
