import os
import sys
import uuid
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from app.auth.firebase import require_firebase_user, optional_firebase_user
from app.db.database import db
from app.agents.orchestrator import orchestrator

client = TestClient(app)

current_test_user = {
    "uid": "p1_test_user_uid",
    "email": "p1_test@rajasthan.gov.in",
    "name": "P1 Intelligence Test User",
    "role": "candidate",
}

async def mock_auth_dependency():
    return current_test_user

@pytest.fixture(autouse=True)
def setup_auth_overrides():
    app.dependency_overrides[require_firebase_user] = mock_auth_dependency
    app.dependency_overrides[optional_firebase_user] = mock_auth_dependency
    yield
    app.dependency_overrides.pop(require_firebase_user, None)
    app.dependency_overrides.pop(optional_firebase_user, None)


def test_p1_government_analytics_intelligence():
    """Verify live branch demand, sector distribution, and documented metric definitions."""
    res = client.get("/analytics/technical-education")
    assert res.status_code == 200
    data = res.json()

    assert data["department"] == "Technical Education Department, Govt. of Rajasthan"
    assert "dataset_metadata" in data
    assert data["dataset_metadata"]["dataset_label"] == "Prototype Seeded Dataset (Coverage: Limited)"

    # Verify Summary KPIs
    summary = data["summary_kpis"]
    assert summary["total_opportunities"] >= 5
    assert summary["govt_opportunities"] >= 1

    # Verify Branch Demand items are derived dynamically
    assert len(data["branch_demand"]) > 0
    for item in data["branch_demand"]:
        assert "branch" in item
        assert "active_openings" in item
        assert "demand_index" in item
        assert isinstance(item["top_demanded_skills"], list)

    # Verify Sector Distribution
    assert len(data["sector_distribution"]) >= 4
    total_pct = sum(s["percentage"] for s in data["sector_distribution"])
    assert 95 <= total_pct <= 105

    # Verify Top Missing / In-Demand Skills
    assert len(data["top_missing_skills"]) > 0
    for sk in data["top_missing_skills"]:
        assert "skill_name" in sk
        assert sk["frequency_in_demand"] >= 1

    # Verify Supply Demand Gaps
    assert len(data["supply_demand_gaps"]) > 0
    for gap in data["supply_demand_gaps"]:
        assert "supply_status" in gap
        assert "policy_recommendation" in gap

    # Verify Metric Definitions
    assert len(data["metric_definitions"]) >= 4
    for m in data["metric_definitions"]:
        assert "metric_name" in m
        assert "data_source" in m
        assert "calculation_formula" in m
        assert "limitations" in m


def test_p1_explainable_matchmaking_and_next_best_action():
    """Verify multi-factor match breakdown, positive signals, and database-backed Next Best Action."""
    # 1. Evaluate fit with explainable breakdown
    payload = {
        "candidate_skills": ["Power Systems", "Circuit Design", "MATLAB"],
        "branch": "Electrical Engineering",
        "qualification": "Polytechnic Diploma",
        "location": "Jodhpur, Rajasthan",
        "career_goal": "Assistant Engineer Power Grid",
        "target_role": "Assistant Engineer Electrical"
    }
    res = client.post("/matchmaking/evaluate-fit", json=payload)
    assert res.status_code == 200
    fit = res.json()

    assert fit["overall_fit_score"] >= 65
    assert "breakdown" in fit and fit["breakdown"] is not None
    bd = fit["breakdown"]
    assert bd["skills_score"] > 0
    assert bd["branch_score"] == 100
    assert bd["qualification_score"] == 100
    assert bd["location_score"] >= 85
    assert "Overall = (Skills * 0.40)" in bd["formula_description"]

    # Verify Positive Signals & Unlock Actions
    assert len(fit["why_matched"]) >= 2
    assert any("Branch" in s for s in fit["why_matched"])
    assert len(fit["learning_pathway"]) > 0

    # 2. Skill gap analysis with dynamic unlocked opportunities count
    gap_res = client.post("/matchmaking/skill-gap-analysis", json={
        "current_skills": ["Power Systems", "Circuit Design"],
        "target_role": "Electrical & Energy Engineer",
        "qualification": "Polytechnic Diploma",
        "branch": "Electrical"
    })
    assert gap_res.status_code == 200
    gap = gap_res.json()

    assert "next_best_action" in gap
    assert "unlocked_opportunities_count" in gap
    assert gap["unlocked_opportunities_count"] >= 1
    assert "unlocks" in gap["next_best_action"].lower() or "aligned" in gap["next_best_action"].lower()


def test_p1_opportunity_deadline_enforcement():
    """Verify backend enforces deadline expiration rules on applications."""
    # 1. Create an expired opportunity (deadline in the past)
    expired_opp_payload = {
        "title": "Expired Polytechnic Training Program",
        "organization": "Rajasthan State Infrastructure Corp",
        "sector": "industrial_training",
        "location": "Kota, Rajasthan",
        "description": "Historical training batch.",
        "application_deadline": (datetime.utcnow() - timedelta(days=10)).strftime("%Y-%m-%d"),
        "branch": "Mechanical",
        "skills_required": ["CAD", "Fabrication"]
    }
    create_res = client.post("/opportunities", json=expired_opp_payload)
    assert create_res.status_code == 200
    opp_id = create_res.json()["id"]

    # 2. Attempt to apply to the expired opportunity -> Expect 400 Bad Request
    apply_res = client.post(f"/opportunities/{opp_id}/apply", json={"cover_note": "Applying late."})
    assert apply_res.status_code == 400
    assert "expired" in apply_res.json()["detail"].lower()


def test_p1_deterministic_ai_fallback():
    """Verify deterministic fallback runs without crashing when AI is unconfigured or offline."""
    import asyncio
    # Ensure orchestrator gemini_client has empty key for deterministic execution
    original_key = orchestrator.gemini_client.api_key
    orchestrator.gemini_client.api_key = ""

    async def _run():
        # Create a test job
        job = await db.create_job(
            title="Senior Substation Electrical Engineer",
            company="Rajasthan Rajya Vidyut Utpadan Nigam (RVUNL)",
            location="Jaipur / Kota",
            experience_range="Fresher / 0-2 yrs",
            description="Looking for an electrical engineer skilled in Power Systems, PLC, SCADA, MATLAB, and Substation Automation.",
            requirement_analysis={},
            evaluation_framework={
                "criteria": [
                    {"name": "Technical Domain Fit", "weight": 40},
                    {"name": "Practical Execution", "weight": 35},
                    {"name": "Safety & Standards", "weight": 25}
                ]
            },
            ai_status="ready"
        )
        job_id = job["id"]

        sample_resume_text = """
        Lakshya Sharma
        lakshya.sharma@rajasthan.polytech.ac.in
        Diploma in Electrical Engineering, Govt Polytechnic College Jodhpur
        Skills: Power Systems, MATLAB, Circuit Design, PLC, SCADA, Substation Automation
        Projects: Solar Microgrid Simulation in MATLAB, Smart Grid telemetry monitoring.
        """

        result = await orchestrator.run_candidate_evaluation(
            job_id=job_id,
            resume_bytes=sample_resume_text.encode("utf-8"),
            filename="lakshya_sharma_resume.txt"
        )

        assert result is not None
        assert result["is_fallback"] is True
        assert result["evaluation"]["score"] >= 60
        assert len(result["evaluation"]["strengths"]) >= 1
        assert "concerns" in result["critique"] or "risk_factors" in result["critique"]
        assert result["decision"]["verdict"] in ("Strong Hire", "Consider", "Hire", "Reject")
        assert result["report"]["report_data"]["is_fallback"] is True
        assert result["report"]["report_data"]["ai_mode"] == "deterministic_fallback"

    try:
        asyncio.run(_run())
    finally:
        orchestrator.gemini_client.api_key = original_key


def test_p1_recruiter_candidate_comparison():
    """Verify side-by-side comparison of multiple evaluated candidates."""
    import asyncio
    
    async def _run():
        # 1. Create a job
        job = await db.create_job(
            title="Renewable Energy Grid Engineer",
            company="Rajasthan Solar Park Authority",
            location="Jodhpur / Bhadla",
            experience_range="Fresher",
            description="Evaluate power systems candidates for Bhadla Solar Park operations.",
            requirement_analysis={},
            evaluation_framework={
                "criteria": [
                    {"name": "Domain Skills", "weight": 50},
                    {"name": "Hands-on Projects", "weight": 50}
                ]
            },
            ai_status="ready"
        )
        job_id = str(job["id"])

        # 2. Evaluate Candidate A
        resume_a = b"""Priya Verma\npriya@rajasthan.gov.in\nSkills: Power Systems, Solar PV, PLC, MATLAB, Grid Analysis\nExperience: 2 years solar monitoring at Bhadla."""
        res_a = await orchestrator.run_candidate_evaluation(
            job_id=job_id,
            resume_bytes=resume_a,
            filename="priya_resume.txt"
        )
        eval_id_a = str(res_a["evaluation"]["id"])

        # 3. Evaluate Candidate B
        resume_b = b"""Rahul Meena\nrahul@rajasthan.gov.in\nSkills: Basic Circuit Design, Python\nExperience: Fresher."""
        res_b = await orchestrator.run_candidate_evaluation(
            job_id=job_id,
            resume_bytes=resume_b,
            filename="rahul_resume.txt"
        )
        eval_id_b = str(res_b["evaluation"]["id"])

        # 4. Call candidate comparison endpoint
        compare_res = client.post(f"/recruiter/jobs/{job_id}/compare", json={
            "evaluation_ids": [eval_id_a, eval_id_b]
        })
        assert compare_res.status_code == 200
        comp = compare_res.json()

        assert comp["job_id"] == job_id
        assert len(comp["compared_candidates"]) == 2
        assert "winner_evaluation_id" in comp
        assert "tradeoff_summary" in comp
        assert "why_ranked_first" in comp
        assert len(comp["key_differentiators"]) >= 2

    asyncio.run(_run())
