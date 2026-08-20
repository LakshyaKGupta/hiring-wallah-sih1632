from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.db.database import db
from app.agents.orchestrator import orchestrator
import logging

logger = logging.getLogger("hiring_wallah.api.candidate")

router = APIRouter(prefix="/candidate", tags=["Candidate"])

@router.post("/analyze")
async def analyze_candidate_profile_endpoint(
    target_role: str = Form(...),
    resume: UploadFile = File(...)
):
    """
    Analyzes a candidate resume against their target role. Returns the generated
    application preparation session details.
    """
    try:
        content = await resume.read()
        result = await orchestrator.run_candidate_analysis(
            target_role=target_role,
            resume_bytes=content,
            filename=resume.filename
        )
        return result
    except Exception as e:
        logger.error(f"Error executing candidate analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Candidate analysis failed: {str(e)}")

@router.get("/report/{session_id}")
@router.get("/session/{session_id}")
async def get_candidate_report_endpoint(session_id: str):
    """
    Retrieves a candidate's previous application strategy and preparation report.
    """
    try:
        session = await db.get_candidate_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Candidate session report not found.")
            
        candidate = await db.get_candidate(session["candidate_id"])
        
        # Parse fields into helpful lists for the overview cards
        skill_gaps_raw = session.get("skill_gaps") or {}
        if isinstance(skill_gaps_raw, dict):
            skill_gaps_list = [f"{k}: {v}" if isinstance(v, str) and not v.startswith(str(k)) else str(v) for k, v in skill_gaps_raw.items()]
        elif isinstance(skill_gaps_raw, list):
            skill_gaps_list = [str(x) for x in skill_gaps_raw]
        else:
            skill_gaps_list = []

        resume_sug_raw = session.get("tailored_resume_suggestions") or {}
        if isinstance(resume_sug_raw, dict):
            missing_keywords = [str(k) for k in resume_sug_raw.keys()]
            strengths = [str(v) for v in resume_sug_raw.values()]
        elif isinstance(resume_sug_raw, list):
            missing_keywords = [str(x) for x in resume_sug_raw]
            strengths = []
        else:
            missing_keywords = []
            strengths = []

        parsed_profile = (candidate or {}).get("parsed_profile") or {}
        verified_claims = parsed_profile.get("skills_demonstrated") or []

        return {
            "session": session,
            "candidate": candidate,
            "resume_score": session.get("fit_score", 85),
            "match_strength": session.get("fit_score", 85),
            "pending_actions": len(skill_gaps_list) if skill_gaps_list else 3,
            "top_role": session.get("target_role", "Engineering Candidate"),
            "next_best_action": skill_gaps_list[0] if skill_gaps_list else "Complete your skill gap roadmap and explore verified opportunities.",
            "verified_claims": verified_claims,
            "missing_keywords": missing_keywords,
            "skill_gaps": skill_gaps_list,
            "strengths": strengths
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching candidate report {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve candidate report.")

@router.get("/public/{username}")
async def get_public_candidate_report(username: str):
    """
    Retrieves a candidate's latest public report using their vanity username.
    """
    try:
        user = await db.get_user_by_username(username)
        if not user:
            raise HTTPException(status_code=404, detail="User profile not found.")
        
        email = user.get("email")
        if not email:
            raise HTTPException(status_code=404, detail="User has no associated email to resolve reports.")

        # Find latest candidate session for this email
        with db.get_connection() as conn:
            cur = conn.execute(
                """
                SELECT cs.* 
                FROM candidate_sessions cs
                JOIN candidates c ON cs.candidate_id = c.id
                WHERE c.email = ?
                ORDER BY cs.created_at DESC
                LIMIT 1
                """,
                (email,)
            )
            row = cur.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="No public report available for this user.")
                
            session = dict(row)
            session["skill_gaps"] = db._decode(session["skill_gaps"])
            session["tailored_resume_suggestions"] = db._decode(session["tailored_resume_suggestions"])
            session["interview_prep"] = db._decode(session["interview_prep"])
            session["job_recommendations"] = db._decode(session["job_recommendations"])
            
            candidate = await db.get_candidate(session["candidate_id"])
            
            return {
                "user": {
                    "display_name": user.get("display_name"),
                    "photo_url": user.get("photo_url"),
                    "username": user.get("username")
                },
                "session": session,
                "candidate": candidate
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching public candidate report for {username}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve public candidate report.")
