import os
import sys
import json
import pytest
import hashlib
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from app.auth.firebase import require_firebase_user, optional_firebase_user
from app.db.database import db

client = TestClient(app)

# Global test state to simulate dynamic candidate/recruiter authentication
current_user = {
    "uid": "candidate_alpha_uid",
    "email": "alpha@rajasthan.gov.in",
    "name": "Candidate Alpha",
    "role": "candidate",
}

async def mock_auth_dependency():
    return current_user

@pytest.fixture(autouse=True)
def setup_auth_overrides():
    app.dependency_overrides[require_firebase_user] = mock_auth_dependency
    app.dependency_overrides[optional_firebase_user] = mock_auth_dependency
    yield
    app.dependency_overrides.pop(require_firebase_user, None)
    app.dependency_overrides.pop(optional_firebase_user, None)


def test_qa_multi_user_candidate_isolation():
    """Verify Candidate A and Candidate B data are strictly isolated across all portals."""
    import uuid
    global current_user

    cand_a_uid = f"cand_a_{uuid.uuid4()}"
    cand_b_uid = f"cand_b_{uuid.uuid4()}"

    # 1. Candidate A applies to an opportunity
    current_user = {
        "uid": cand_a_uid,
        "email": "cand_a@rajasthan.gov.in",
        "name": "Candidate A",
        "role": "candidate",
    }
    
    # Get an active, non-expired opportunity
    from datetime import datetime
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    opps = client.get("/opportunities").json()
    assert len(opps) > 0
    active_opps = [o for o in opps if not o.get("application_deadline") or o.get("application_deadline") >= today_str]
    assert len(active_opps) > 0
    opp_id = active_opps[0]["id"]

    # Candidate A applies
    apply_res = client.post(f"/opportunities/{opp_id}/apply", json={"cover_note": "Application by Candidate A"})
    assert apply_res.status_code == 200

    # Candidate A books counselor
    counselors = client.get("/counseling/counselors").json()
    counselor_id = counselors[0]["id"]
    book_res = client.post("/counseling/book", json={
        "counselor_id": counselor_id,
        "topic": "Career Transition",
        "preferred_mode": "online",
        "slot_time": "Friday 10:00 AM"
    })
    assert book_res.status_code == 200

    # Candidate A requests mentor
    mentors = client.get("/mentorship/mentors").json()
    mentor_id = mentors[0]["id"]
    mentor_req = client.post("/mentorship/request", json={
        "mentor_id": mentor_id,
        "career_goals": "Smart Grid Engineer",
        "technical_interests": ["Power Systems"]
    })
    assert mentor_req.status_code == 200

    # Verify Candidate A sees their records
    a_apps = client.get("/opportunities/applications/me").json()
    assert len(a_apps) >= 1
    assert any(a["opportunity_id"] == opp_id for a in a_apps)

    a_sessions = client.get("/counseling/my-sessions").json()
    assert len(a_sessions) >= 1
    assert any(s["counselor_id"] == counselor_id for s in a_sessions)

    a_reqs = client.get("/mentorship/my-requests").json()
    assert len(a_reqs) >= 1
    assert any(r["mentor_id"] == mentor_id for r in a_reqs)

    # 2. Switch context to Candidate B (FRESH USER)
    current_user = {
        "uid": cand_b_uid,
        "email": "cand_b@rajasthan.gov.in",
        "name": "Candidate B",
        "role": "candidate",
    }

    # Verify Candidate B CANNOT see Candidate A's applications
    b_apps = client.get("/opportunities/applications/me").json()
    assert len(b_apps) == 0, "Candidate B leaked Candidate A's applications!"

    # Verify Candidate B CANNOT see Candidate A's counseling sessions
    b_sessions = client.get("/counseling/my-sessions").json()
    assert len(b_sessions) == 0, "Candidate B leaked Candidate A's counseling sessions!"

    # Verify Candidate B CANNOT see Candidate A's mentorship requests
    b_reqs = client.get("/mentorship/my-requests").json()
    assert len(b_reqs) == 0, "Candidate B leaked Candidate A's mentorship requests!"


def test_qa_sha256_canonical_hashing_and_tampering_detection():
    """Verify SHA-256 fingerprint generation and adversarial tampering detection."""
    import asyncio
    
    # 1. Generate report in DB
    report_data = {
        "candidate_name": "Test Verified Candidate",
        "candidate_score": 92,
        "final_recommendation": "Strong Hire",
        "confidence": 95,
        "evidence": ["Led solar microgrid rollout across 5 substations."],
        "why_hire": ["Exceptional domain execution in renewable energy."]
    }
    
    # Insert report using db.create_report
    created = asyncio.run(db.create_report(
        evaluation_id="eval-sha256-001",
        candidate_id="cand-sha256-001",
        job_id="job-sha256-001",
        report_data=report_data
    ))
    report_id = created["id"]
    
    assert "sha256_hash" in created["report_data"]
    original_hash = created["report_data"]["sha256_hash"]
    assert len(original_hash) == 64

    # 2. Verify integrity via API endpoint
    res = client.get(f"/recruiter/report/{report_id}/integrity")
    assert res.status_code == 200
    integrity = res.json()
    assert integrity["valid"] is True
    assert integrity["sha256"] == original_hash

    # 3. Adversarial Tampering: modify a single field in the DB report_data without updating hash
    tampered_data = dict(created["report_data"])
    tampered_data["candidate_score"] = 99  # Unauthorized score alteration
    
    asyncio.run(db._execute(
        "UPDATE reports SET report_data = %s WHERE id = %s",
        (db._encode(tampered_data), report_id)
    ))

    # 4. Re-verify integrity via API endpoint -> MUST report valid: False (Tamper Detected!)
    tampered_res = client.get(f"/recruiter/report/{report_id}/integrity")
    assert tampered_res.status_code == 200
    tampered_integrity = tampered_res.json()
    assert tampered_integrity["valid"] is False, "SHA-256 integrity verification failed to detect tampered database record!"
    assert tampered_integrity["status"] == "INTEGRITY CHECK FAILED"


def test_qa_recruiter_candidate_status_mutation():
    """Verify recruiter candidate status workflow mutations and persistence."""
    import asyncio
    
    # Seed evaluation
    eval_created = asyncio.run(db.create_evaluation(
        candidate_id="cand-status-001",
        job_id="job-status-001",
        score=88,
        breakdown={},
        strengths=["Quick learner"],
        weaknesses=[],
        evidence=[]
    ))
    eval_id = eval_created["id"]

    # Mutate to 'Shortlisted'
    res1 = client.patch(f"/recruiter/evaluation/{eval_id}/status", json={"status": "Shortlisted"})
    assert res1.status_code == 200
    assert res1.json()["status"] == "Shortlisted"

    # Mutate to 'Interview Scheduled'
    res2 = client.patch(f"/recruiter/evaluation/{eval_id}/status", json={"status": "Interview Scheduled"})
    assert res2.status_code == 200
    assert res2.json()["status"] == "Interview Scheduled"

    # Mutate to 'Offer Extended'
    res3 = client.patch(f"/recruiter/evaluation/{eval_id}/status", json={"status": "Offer Extended"})
    assert res3.status_code == 200
    assert res3.json()["status"] == "Offer Extended"


def test_qa_matchmaking_input_responsiveness():
    """Verify matchmaking recommendations change meaningfully when candidate branch/skills change."""
    # Electrical payload
    elec_payload = {
        "candidate_skills": ["Power Systems", "Transformers", "HVAC"],
        "branch": "Electrical Engineering",
        "qualification": "B.Tech",
        "target_role": "Junior Engineer Electrical"
    }
    elec_res = client.post("/matchmaking/recommendations", json=elec_payload).json()
    
    # CS/IT payload
    cs_payload = {
        "candidate_skills": ["React", "FastAPI", "PostgreSQL", "Docker"],
        "branch": "Computer Science / IT",
        "qualification": "B.Tech",
        "target_role": "Full Stack Developer"
    }
    cs_res = client.post("/matchmaking/recommendations", json=cs_payload).json()

    # Recommendations should be different
    assert elec_res["recommendations"] != cs_res["recommendations"]
