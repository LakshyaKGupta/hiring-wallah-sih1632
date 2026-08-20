from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class UserProfileUpsert(BaseModel):
    role: str = Field(..., pattern="^(recruiter|candidate)$")
    display_name: Optional[str] = None
    company_name: Optional[str] = None

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    username: Optional[str] = None
    company_name: Optional[str] = None

class UserProfileResponse(BaseModel):
    firebase_uid: str
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    role: str
    company_id: Optional[UUID] = None
    company_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

# Job Models
class JobCreate(BaseModel):
    title: str = Field(..., example="Software Engineer")
    company: Optional[str] = Field(None, example="Hiring Wallah")
    location: Optional[str] = Field(None, example="Remote")
    experience_range: Optional[str] = Field(None, example="2-5 years")
    description: str = Field(..., example="Looking for a Python developer with FastAPI experience.")

class JobResponse(BaseModel):
    id: UUID
    title: str
    company: Optional[str]
    location: Optional[str] = None
    experience_range: Optional[str] = None
    description: str
    requirement_analysis: Optional[Dict[str, Any]] = None
    evaluation_framework: Optional[Dict[str, Any]] = None
    ai_status: Optional[str] = None
    owner_uid: Optional[str] = None
    company_id: Optional[UUID] = None
    created_at: datetime

# Candidate Models
class CandidateResponse(BaseModel):
    id: UUID
    name: Optional[str]
    email: Optional[str]
    parsed_profile: Optional[Dict[str, Any]] = None
    raw_resume_text: Optional[str]
    created_at: datetime

# Evaluation Models
class EvaluationResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    score: int
    breakdown: Dict[str, Any]
    strengths: List[str]
    weaknesses: List[str]
    evidence: List[str]
    devils_advocate: Optional[Dict[str, Any]] = None
    created_at: datetime

# Decision Models
class DecisionResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    verdict: str
    confidence: int
    explanation: str
    interview_questions: List[str]
    ranking: Optional[int] = None
    created_at: datetime

# Candidate Session Models
class CandidateSessionResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    target_role: str
    fit_score: int
    skill_gaps: Dict[str, Any]
    tailored_resume_suggestions: Dict[str, Any]
    cover_letter: str
    interview_prep: Dict[str, Any]
    job_recommendations: Optional[Dict[str, Any]] = None
    created_at: datetime

# API Pipeline Requests & Responses
class RecruiterEvaluateResponse(BaseModel):
    job: JobResponse
    candidates: List[Dict[str, Any]] # Combined profile, evaluation, critique, decision

class CandidateAnalyzeRequest(BaseModel):
    target_role: str

# Autonomous Agent Tasks & Event Loops
class AgentTaskCreate(BaseModel):
    task_type: str
    payload: Dict[str, Any]

class AgentTaskResponse(BaseModel):
    id: UUID
    task_type: str
    status: str
    payload: Dict[str, Any]
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Continuous Learning & Feedback
class FeedbackOverrideRequest(BaseModel):
    job_id: str
    candidate_id: str
    ai_rank: int
    human_rank: int
    feedback_reason: str

class LearningEventResponse(BaseModel):
    id: UUID
    job_id: UUID
    candidate_id: UUID
    ai_rank: int
    human_rank: int
    difference: int
    feedback_reason: str
    created_at: datetime


# ==========================================
# SIH1632 - Rajasthan Technical Education Platform Models
# ==========================================

class OpportunityCreate(BaseModel):
    title: str = Field(..., example="Junior Engineer (Electrical)")
    organization: str = Field(..., example="Rajasthan Rajya Vidyut Utpadan Nigam (RVUNL)")
    sector: str = Field(..., description="private_job, govt_job, overseas, internship, industrial_training")
    opportunity_type: Optional[str] = Field("full_time", description="full_time, part_time, internship, training, contract")
    department: Optional[str] = Field(None, example="Energy / Technical Education Department")
    location: str = Field(..., example="Jaipur, Rajasthan")
    stipend_or_salary: Optional[str] = Field(None, example="Level 10 (Pay Matrix: ₹33,800 - ₹1,06,700)")
    experience_level: Optional[str] = Field("Fresher", example="Fresher / 0-2 years")
    qualification_required: Optional[str] = Field(None, example="B.Tech / Diploma in Electrical Engineering")
    branch: Optional[str] = Field(None, example="Electrical / Power Systems")
    skills_required: Optional[List[str]] = Field(default_factory=list, example=["Power Distribution", "Circuit Design", "MATLAB", "PLC Basics"])
    eligibility_criteria: Optional[str] = Field(None, example="Min 60% in Engineering / Polytechnic Diploma")
    application_deadline: Optional[str] = Field(None, example="2026-09-30")
    official_link: Optional[str] = Field(None, example="https://energy.rajasthan.gov.in")
    source: Optional[str] = Field("Rajasthan Technical Education Portal", example="Technical Education Department, Govt. of Rajasthan")
    description: str = Field(..., example="Comprehensive opportunity for electrical engineering diploma and degree holders in Rajasthan state power projects.")
    is_verified: bool = Field(True)

class OpportunityResponse(BaseModel):
    id: str
    title: str
    organization: str
    sector: str
    opportunity_type: Optional[str] = None
    department: Optional[str] = None
    location: str
    stipend_or_salary: Optional[str] = None
    experience_level: Optional[str] = None
    qualification_required: Optional[str] = None
    branch: Optional[str] = None
    skills_required: Optional[List[str]] = Field(default_factory=list)
    eligibility_criteria: Optional[str] = None
    application_deadline: Optional[str] = None
    official_link: Optional[str] = None
    source: Optional[str] = None
    description: str
    is_verified: bool = True
    created_at: str

class ApplicationCreate(BaseModel):
    opportunity_id: Optional[str] = None
    candidate_id: Optional[str] = None
    resume_id: Optional[str] = None
    cover_note: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    opportunity_id: str
    candidate_id: Optional[str] = None
    user_uid: Optional[str] = None
    status: str
    match_score: Optional[int] = None
    resume_id: Optional[str] = None
    cover_note: Optional[str] = None
    applied_at: str
    opportunity: Optional[Dict[str, Any]] = None

class CounselorResponse(BaseModel):
    id: str
    name: str
    title: str
    specialization: str
    organization: str
    experience_years: int
    rating: float
    available_slots: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    bio: str
    contact_email: str
    created_at: str

class CounselingBookingRequest(BaseModel):
    counselor_id: str
    candidate_id: Optional[str] = None
    topic: str = Field(..., example="Choosing between Rajasthan Govt Tech Exams and Private MNC Placements")
    preferred_mode: str = Field("online", description="online or offline")
    slot_time: str = Field(..., example="Monday 4:00 PM - 5:00 PM")
    notes: Optional[str] = None

class CounselingSessionResponse(BaseModel):
    id: str
    counselor_id: str
    candidate_id: Optional[str] = None
    user_uid: Optional[str] = None
    topic: str
    preferred_mode: str
    slot_time: str
    status: str
    notes: Optional[str] = None
    counselor: Optional[Dict[str, Any]] = None
    created_at: str

class MentorResponse(BaseModel):
    id: str
    name: str
    designation: str
    company_or_dept: str
    industry: str
    alumni_institution: Optional[str] = None
    expertise_areas: List[str] = Field(default_factory=list)
    max_mentees: int
    current_mentees: int
    bio: str
    linkedin_url: Optional[str] = None
    created_at: str

class MentorshipRequestCreate(BaseModel):
    mentor_id: str
    candidate_id: Optional[str] = None
    career_goals: str = Field(..., example="Aspiring to join Rajasthan Renewable Energy or Smart Grid sector.")
    technical_interests: List[str] = Field(default_factory=list, example=["Solar Power Systems", "IoT Grids", "Embedded Controls"])

class MentorshipRequestResponse(BaseModel):
    id: str
    mentor_id: str
    candidate_id: Optional[str] = None
    user_uid: Optional[str] = None
    career_goals: str
    technical_interests: List[str] = Field(default_factory=list)
    status: str
    mentor: Optional[Dict[str, Any]] = None
    created_at: str

class GuidanceResourceResponse(BaseModel):
    id: str
    title: str
    category: str
    target_audience: str
    content: str
    tags: List[str] = Field(default_factory=list)
    attachments: Optional[List[Dict[str, str]]] = Field(default_factory=list)
class ExplainableMatchBreakdown(BaseModel):
    eligibility_score: int = 100
    skills_score: int
    branch_score: int
    qualification_score: int
    location_score: int
    career_goal_score: int
    overall_fit_score: int
    formula_description: str = "Overall = (Skills * 0.40) + (Branch * 0.20) + (Qualification * 0.20) + (Location * 0.10) + (CareerGoal * 0.10)"

class MatchmakingEvaluateRequest(BaseModel):
    opportunity_id: Optional[str] = None
    target_role: Optional[str] = None
    candidate_skills: List[str] = Field(default_factory=list)
    qualification: Optional[str] = None
    branch: Optional[str] = None
    location: Optional[str] = None
    career_goal: Optional[str] = None
    resume_text: Optional[str] = None

class MatchmakingFitResponse(BaseModel):
    overall_fit_score: int
    skills_match_score: int
    matching_skills: List[str]
    missing_skills: List[str]
    qualification_match: bool
    branch_match: bool
    verdict: str
    explainable_summary: str
    breakdown: Optional[ExplainableMatchBreakdown] = None
    why_matched: List[str] = Field(default_factory=list)
    missing_requirements: List[str] = Field(default_factory=list)
    unlock_actions: List[str] = Field(default_factory=list)
    learning_pathway: List[Dict[str, Any]] = Field(default_factory=list)
    interview_readiness_score: int = 75

class SkillGapAnalysisRequest(BaseModel):
    current_skills: List[str]
    target_role: str
    target_sector: Optional[str] = "all"
    qualification: Optional[str] = None
    branch: Optional[str] = None

class AICounselorQueryRequest(BaseModel):
    query: str
    student_branch: Optional[str] = "Computer Science / Technical Engineering"
    qualification: Optional[str] = "B.Tech / Polytechnic Diploma"
    target_sector: Optional[str] = "All"
    language_preference: Optional[str] = "English"

class AICounselorQueryResponse(BaseModel):
    answer: str
    recommended_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    actionable_steps: List[str] = Field(default_factory=list)
    related_resources: List[Dict[str, Any]] = Field(default_factory=list)

# Candidate Comparison Models
class CandidateComparisonRequest(BaseModel):
    evaluation_ids: List[str] = Field(..., min_length=2, max_length=4)

class CandidateComparisonItem(BaseModel):
    evaluation_id: str
    candidate_id: str
    candidate_name: str
    overall_score: int
    verdict: str
    confidence: int
    skills_match_percentage: int
    evidence_coverage_percentage: int
    verified_claims_count: int
    total_claims_count: int
    critical_concerns_count: int
    top_strengths: List[str]
    key_risks: List[str]
    devils_advocate_score: Optional[int] = None
    agent_disagreement_delta: int = 0
    is_fallback_evaluation: bool = False

class CandidateComparisonResponse(BaseModel):
    job_id: str
    job_title: str
    compared_candidates: List[CandidateComparisonItem]
    winner_evaluation_id: Optional[str] = None
    tradeoff_summary: str
    why_ranked_first: str
    key_differentiators: List[str]

# Government Analytics Models
class MetricDefinition(BaseModel):
    metric_name: str
    data_source: str
    calculation_formula: str
    time_period: str = "Active Platform Records"
    limitations: str

class BranchDemandItem(BaseModel):
    branch: str
    active_openings: int
    demand_index: int
    top_demanded_skills: List[str]

class SectorDistributionItem(BaseModel):
    sector_key: str
    sector_name: str
    openings_count: int
    percentage: float

class MissingSkillAggregatedItem(BaseModel):
    skill_name: str
    frequency_in_demand: int
    impact_factor: str

class SupplyDemandGapItem(BaseModel):
    branch: str
    demand_openings: int
    training_capacity_openings: int
    supply_status: str
    policy_recommendation: str

class GovernmentAnalyticsResponse(BaseModel):
    department: str = "Technical Education Department, Govt. of Rajasthan"
    platform: str = "Hiring Wallah - SIH1632 Interactive Career & Placement Intelligence"
    dataset_metadata: Dict[str, Any]
    summary_kpis: Dict[str, Any]
    branch_demand: List[BranchDemandItem]
    sector_distribution: List[SectorDistributionItem]
    top_missing_skills: List[MissingSkillAggregatedItem]
    supply_demand_gaps: List[SupplyDemandGapItem]
    institutional_readiness_status: str
    metric_definitions: List[MetricDefinition]

