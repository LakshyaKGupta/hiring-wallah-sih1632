import os
import sys
import json
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock out GeminiClient generate content before importing app modules
from unittest.mock import AsyncMock, patch

mock_gemini_responses = {
    # Agent 1 (Requirement Analyst)
    "RequirementAnalyst": {
        "must_have": ["3+ years Python experience", "FastAPI development"],
        "good_to_have": ["Next.js frontend skills"],
        "red_flags": ["No backend background"],
        "priorities": ["FastAPI", "Python"],
        "role_level": "mid",
        "domain": "engineering"
    },
    # Agent 2 (Hiring Strategist)
    "HiringStrategist": {
        "evaluation_framework": {
            "technical_skills": 50,
            "product_thinking": 30,
            "communication": 20
        },
        "total_weight": 100,
        "rationale": "Focus on engineering depth.",
        "criteria_per_dimension": {
            "technical_skills": "Strong FastAPI knowledge.",
            "product_thinking": "Able to design systems.",
            "communication": "Clear writing."
        }
    },
    # Agent 3 (Resume Investigator)
    "ResumeInvestigator": {
        "name": "Jane Doe",
        "experience_years": 4.0,
        "projects": [
            {
                "name": "Hiring Wallah",
                "description": "Full-stack agentic hiring platform.",
                "evidence": ["Built FastAPI backend", "Setup postgres db"],
                "impact": "Automated CV screening.",
                "technologies": ["Python", "FastAPI", "PostgreSQL"]
            }
        ],
        "skills_demonstrated": ["Python", "FastAPI", "PostgreSQL", "Next.js"],
        "quantified_achievements": ["Decreased screening time by 50%"],
        "education": ["B.Tech Computer Science"],
        "missing_evidence": ["No cloud deployment details"],
        "career_trajectory": "Consistent software developer growth"
    },
    # Agent 4 (Candidate Evaluator)
    "CandidateEvaluator": {
        "overall_score": 85,
        "breakdown": {
            "technical_skills": {
                "score": 90,
                "evidence": ["Built FastAPI backend", "4 years Python"],
                "justification": "Candidate has excellent backend skills."
            },
            "product_thinking": {
                "score": 80,
                "evidence": ["Designed system architecture for Hiring Wallah"],
                "justification": "Good ownership."
            },
            "communication": {
                "score": 80,
                "evidence": ["Resume is well structured"],
                "justification": "Communicates clearly."
            }
        },
        "strengths": ["Excellent technical skills", "Proven ownership"],
        "weaknesses": ["Missing cloud deployment experience"],
        "evidence_quality": "strong"
    },
    # Agent 5 (Devil's Advocate)
    "DevilsAdvocate": {
        "contested_claims": [
            {
                "original_claim": "Strong technical skills (score: 90)",
                "counter": "No official cloud certification or scale metrics.",
                "severity": "medium"
            }
        ],
        "risk_factors": ["Scale constraints not specified"],
        "overall_confidence_adjustment": -5,
        "recommendation": "flag"
    },
    # Agent 6 (Hiring Committee)
    "HiringCommittee": {
        "verdict": "Strong Hire",
        "confidence": 80,
        "final_explanation": "Jane has great backend foundations.",
        "key_deciding_factors": ["FastAPI experience", "System design capability"],
        "suggested_interview_questions": ["How do you handle scalability?"],
        "risk_summary": "Unverified cloud skills"
    },
    # Candidate Analyst
    "CandidateAnalyst": {
        "fit_score": 88,
        "skill_gaps": {
            "Cloud Deployment": "Resume lacks AWS or GCP details."
        },
        "tailored_resume_suggestions": {
            "Built FastAPI backend": "Designed and deployed FastAPI backend to handle 10k requests."
        },
        "cover_letter": "Dear Hiring Manager, I am excited...",
        "interview_prep": {
            "Tell me about a challenging project": "Walk through STAR structure for Hiring Wallah."
        },
        "job_recommendations": {
            "roles": ["Python Engineer", "Backend Developer"],
            "industries": ["SaaS", "FinTech"]
        }
    }
}

# Apply patches before importing the main application
from app.utils.gemini_client import GeminiClient

async def dummy_generate(self, prompt: str, retry_count: int = 1) -> str:
    # Identify which agent is calling by inspecting unique prompt substrings
    if "Analyze the following job description" in prompt:
        return json.dumps(mock_gemini_responses["RequirementAnalyst"])
    elif "hiring committee chair designing" in prompt:
        return json.dumps(mock_gemini_responses["HiringStrategist"])
    elif "forensic resume analyst" in prompt:
        return json.dumps(mock_gemini_responses["ResumeInvestigator"])
    elif "structured hiring evaluator" in prompt:
        return json.dumps(mock_gemini_responses["CandidateEvaluator"])
    elif "adversarial evaluator" in prompt:
        return json.dumps(mock_gemini_responses["DevilsAdvocate"])
    elif "chair of a hiring committee" in prompt or "adversarial critique" in prompt:
        return json.dumps(mock_gemini_responses["HiringCommittee"])
    elif "career coach" in prompt:
        return json.dumps(mock_gemini_responses["CandidateAnalyst"])
        
    # Fallback to a default response
    return json.dumps(mock_gemini_responses["RequirementAnalyst"])

GeminiClient.generate = dummy_generate

from main import app
from app.auth.firebase import require_firebase_user

client = TestClient(app)

async def fake_firebase_user():
    return {
        "uid": "test-recruiter-uid",
        "email": "recruiter@example.com",
        "name": "Test Recruiter",
        "picture": "",
    }

@pytest.fixture(autouse=True)
def setup_auth_overrides():
    app.dependency_overrides[require_firebase_user] = fake_firebase_user
    yield
    app.dependency_overrides[require_firebase_user] = fake_firebase_user

def ensure_recruiter_profile():
    response = client.post(
        "/auth/profile",
        json={"role": "recruiter", "display_name": "Test Recruiter", "company_name": "LakshyaCorp"},
    )
    assert response.status_code == 200

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_jobs():
    ensure_recruiter_profile()
    # 1. Create a job description
    payload = {
        "title": "Software Development Engineer",
        "company": "LakshyaCorp",
        "description": "Looking for a backend FastAPI engineer with 3+ years experience."
    }
    response = client.post("/jobs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Software Development Engineer"
    assert "requirement_analysis" in data
    assert "evaluation_framework" in data
    job_id = data["id"]
    
    # 2. List jobs
    list_response = client.get("/jobs")
    assert list_response.status_code == 200
    assert len(list_response.json()) > 0

def test_recruiter_pipeline():
    ensure_recruiter_profile()
    # Setup job
    job_payload = {
        "title": "SDE Mid",
        "company": "LakshyaCorp",
        "description": "FastAPI engineer required."
    }
    job_res = client.post("/jobs", json=job_payload)
    job_id = job_res.json()["id"]

    # Upload mock resume
    import io
    # Create a dummy PDF file structure
    dummy_pdf = io.BytesIO(b"%PDF-1.4 ... dummy content ...")
    
    # Mock parse_resume to return a valid text
    with patch('app.api.recruiter.parse_resume', return_value="Jane Doe. Python, FastAPI, PostgreSQL Developer."), \
         patch('app.agents.orchestrator.parse_resume', return_value="Jane Doe. Python, FastAPI, PostgreSQL Developer."):
        # Also simulate sync evaluation if running in test environment
        res_upload = client.post(
            "/recruiter/evaluate",
            data={"job_id": job_id},
            files=[("resumes", ("resume_jane_doe.pdf", dummy_pdf, "application/pdf"))]
        )
        assert res_upload.status_code == 200
        
        # Run orchestrator evaluation for test verification
        import asyncio
        from app.agents.orchestrator import orchestrator
        results = asyncio.run(orchestrator.evaluate_multiple_candidates(job_id, [(b"dummy", "resume_jane_doe.pdf")]))
        data = {"results": results}
        assert "results" in data
        assert len(data["results"]) == 1
        
        cand_res = data["results"][0]
        assert cand_res["profile"]["name"] == "Jane Doe"
        assert cand_res["decision"]["verdict"] == "Strong Hire"
        assert 0 <= cand_res["decision"]["confidence"] <= 100
        assert cand_res["decision"]["ranking"] == 1
        assert "ranking_rationale" in cand_res["decision"]
        assert cand_res["evaluation"]["evidence_items"]
        
        # Test fetching details
        eval_id = cand_res["evaluation_id"]
        detail_res = client.get(f"/recruiter/evaluation/{eval_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["evaluation"]["score"] == 85
        assert detail_data["candidate"]["name"] == "Jane Doe"

def test_candidate_pipeline():
    import io
    dummy_pdf = io.BytesIO(b"%PDF-1.4 ... dummy content ...")
    
    with patch('app.agents.orchestrator.parse_resume', return_value="Jane Doe. Python, FastAPI, PostgreSQL Developer."):
        response = client.post(
            "/candidate/analyze",
            data={"target_role": "Senior Backend Developer"},
            files={"resume": ("resume_jane_doe.pdf", dummy_pdf, "application/pdf")}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session" in data
        assert data["session"]["fit_score"] == 88
        
        # Test report retrieval
        session_id = data["session"]["id"]
        report_res = client.get(f"/candidate/report/{session_id}")
        assert report_res.status_code == 200
        report_data = report_res.json()
        assert report_data["session"]["target_role"] == "Senior Backend Developer"
        assert "Cloud Deployment" in report_data["session"]["skill_gaps"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
