import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from app.auth.firebase import require_firebase_user, optional_firebase_user

client = TestClient(app)

async def fake_firebase_user():
    return {
        "uid": "test-student-uid",
        "email": "student@rajasthan.gov.in",
        "name": "Rajasthan Technical Student",
        "picture": "",
    }

app.dependency_overrides[require_firebase_user] = fake_firebase_user
app.dependency_overrides[optional_firebase_user] = fake_firebase_user

def test_sih1632_root():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "SIH1632" in data["service"]
    assert "Technical Education Department, Govt. of Rajasthan" in data["initiative"]

def test_opportunities_hub():
    # 1. Sector Stats
    stats_res = client.get("/opportunities/sectors/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total"] >= 10
    assert stats["govt_job"] >= 1
    assert stats["internship"] >= 1
    assert stats["overseas"] >= 1

    # 2. List with sector filter
    govt_res = client.get("/opportunities?sector=govt_job")
    assert govt_res.status_code == 200
    govt_opps = govt_res.json()
    assert len(govt_opps) >= 1
    for opp in govt_opps:
        assert opp["sector"] == "govt_job"

    # 3. Get opportunity detail
    opp_id = govt_opps[0]["id"]
    detail_res = client.get(f"/opportunities/{opp_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == opp_id

    # 4. Apply to opportunity
    apply_res = client.post(f"/opportunities/{opp_id}/apply", json={"cover_note": "Interested in Rajasthan state power projects."})
    assert apply_res.status_code == 200
    assert apply_res.json()["opportunity_id"] == opp_id

def test_matchmaking_and_skill_gaps():
    # 1. AI Fit Evaluation
    fit_payload = {
        "candidate_skills": ["Power Systems", "Circuit Analysis", "MATLAB"],
        "branch": "Electrical Engineering",
        "qualification": "B.Tech",
        "target_role": "Assistant Engineer (Electrical)"
    }
    fit_res = client.post("/matchmaking/evaluate-fit", json=fit_payload)
    assert fit_res.status_code == 200
    fit_data = fit_res.json()
    assert 0 <= fit_data["overall_fit_score"] <= 100
    assert "matching_skills" in fit_data
    assert "missing_skills" in fit_data
    assert len(fit_data["learning_pathway"]) > 0

    # 2. Multi-Sector Recommendations
    rec_res = client.post("/matchmaking/recommendations", json=fit_payload)
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert len(rec_data["recommendations"]) > 0

    # 3. Skill-Gap Analysis
    gap_payload = {
        "current_skills": ["AutoCAD Civil 3D"],
        "target_role": "Junior Engineer Civil",
        "qualification": "Polytechnic Diploma"
    }
    gap_res = client.post("/matchmaking/skill-gap-analysis", json=gap_payload)
    assert gap_res.status_code == 200
    gap_data = gap_res.json()
    assert gap_data["technical_domain"] == "Civil & Infrastructure"
    assert len(gap_data["structured_learning_roadmap"]) > 0

def test_counseling_and_ai_copilot():
    # 1. List Counselors
    c_res = client.get("/counseling/counselors")
    assert c_res.status_code == 200
    counselors = c_res.json()
    assert len(counselors) >= 1

    # 2. Book Session
    counselor_id = counselors[0]["id"]
    book_payload = {
        "counselor_id": counselor_id,
        "topic": "LEET Lateral Entry Guidance",
        "preferred_mode": "online",
        "slot_time": "Monday 4:00 PM"
    }
    book_res = client.post("/counseling/book", json=book_payload)
    assert book_res.status_code == 200
    assert book_res.json()["counselor_id"] == counselor_id

    # 3. Guidance Resources
    res_res = client.get("/counseling/resources")
    assert res_res.status_code == 200
    assert len(res_res.json()) >= 1

    # 4. AI Career Copilot
    copilot_payload = {
        "query": "What are the job opportunities for diploma electrical in Rajasthan?",
        "student_branch": "Electrical Engineering",
        "qualification": "Polytechnic Diploma"
    }
    copilot_res = client.post("/counseling/ai-copilot", json=copilot_payload)
    assert copilot_res.status_code == 200
    copilot_data = copilot_res.json()
    assert len(copilot_data["answer"]) > 50
    assert len(copilot_data["actionable_steps"]) > 0

def test_mentorship_programs():
    # 1. List Mentors
    m_res = client.get("/mentorship/mentors")
    assert m_res.status_code == 200
    mentors = m_res.json()
    assert len(mentors) >= 1

    # 2. Request Mentorship
    mentor_id = mentors[0]["id"]
    req_payload = {
        "mentor_id": mentor_id,
        "career_goals": "Aspiring to join Rajasthan power distribution grid.",
        "technical_interests": ["Smart Grids", "SCADA Automation"]
    }
    req_res = client.post("/mentorship/request", json=req_payload)
    assert req_res.status_code == 200
    assert req_res.json()["mentor_id"] == mentor_id

def test_technical_education_analytics():
    res = client.get("/analytics/technical-education")
    assert res.status_code == 200
    data = res.json()
    assert data["department"] == "Technical Education Department, Govt. of Rajasthan"
    assert "summary_kpis" in data
    assert len(data["branch_demand"]) > 0
    assert len(data["sector_distribution"]) > 0

def test_recruiter_dashboard_stats():
    res = client.get("/recruiter/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert "active_jobs" in data
    assert "candidates_screened" in data
    assert "shortlisted_candidates" in data
    assert "reports_generated" in data
    assert isinstance(data["active_jobs"], int)

def test_candidate_session_alias():
    # First verify 404 for non-existent session
    res = client.get("/candidate/session/non-existent-session-id")
    assert res.status_code == 404
    
    # Verify report route also 404s cleanly
    res_report = client.get("/candidate/report/non-existent-session-id")
    assert res_report.status_code == 404
