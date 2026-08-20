from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import json
import logging
from app.db.database import db
from app.db.models import (
    CounselorResponse,
    CounselingBookingRequest,
    CounselingSessionResponse,
    GuidanceResourceResponse,
    AICounselorQueryRequest,
    AICounselorQueryResponse
)
from app.auth.firebase import optional_firebase_user, require_firebase_user
from app.utils.gemini_client import GeminiClient

logger = logging.getLogger("hiring_wallah.api.counseling")

router = APIRouter(prefix="/counseling", tags=["Career Counseling & Guidance - SIH1632"])
gemini_client = GeminiClient()

@router.get("/counselors", response_model=List[CounselorResponse])
async def list_counselors(
    specialization: Optional[str] = Query(None, description="Filter by specialization (e.g. Polytechnic, Govt, Overseas, Tech)")
):
    """
    Lists verified career counselors from Rajasthan Technical Education Department and industry experts.
    """
    try:
        counselors = await db.get_all_counselors(specialization=specialization)
        return counselors
    except Exception as e:
        logger.error(f"Error listing counselors: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve counselors.")

@router.get("/counselors/{counselor_id}", response_model=CounselorResponse)
async def get_counselor_endpoint(counselor_id: str):
    """
    Retrieves full details of a specific counselor.
    """
    try:
        counselor = await db.get_counselor(counselor_id)
        if not counselor:
            raise HTTPException(status_code=404, detail="Counselor not found.")
        return counselor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting counselor {counselor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve counselor.")

@router.post("/book", response_model=CounselingSessionResponse)
async def book_counseling_session_endpoint(
    payload: CounselingBookingRequest,
    decoded_token: Optional[dict] = Depends(optional_firebase_user)
):
    """
    Books a personalized 1-on-1 counseling session with a career advisor.
    """
    try:
        counselor = await db.get_counselor(payload.counselor_id)
        if not counselor:
            raise HTTPException(status_code=404, detail="Counselor not found.")

        user_uid = decoded_token.get("uid") if decoded_token else None

        session = await db.book_counseling_session(
            counselor_id=payload.counselor_id,
            candidate_id=payload.candidate_id,
            user_uid=user_uid,
            topic=payload.topic,
            preferred_mode=payload.preferred_mode,
            slot_time=payload.slot_time,
            notes=payload.notes
        )
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking counseling session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to book counseling session: {str(e)}")

@router.get("/my-sessions", response_model=List[CounselingSessionResponse])
async def list_my_counseling_sessions(decoded_token: dict = Depends(require_firebase_user)):
    """
    Retrieves all booked counseling sessions for the authenticated student.
    """
    try:
        user_uid = decoded_token.get("uid")
        sessions = await db.get_counseling_sessions(user_uid=user_uid)
        return sessions
    except Exception as e:
        logger.error(f"Error fetching counseling sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sessions.")

@router.get("/resources", response_model=List[GuidanceResourceResponse])
async def list_guidance_resources(
    category: Optional[str] = Query(None, description="govt_exam_roadmap, polytechnic_pathways, internship_handbook, overseas_guidelines, private_tech_prep, or all")
):
    """
    Returns curated career guidance resources, roadmaps, and official Rajasthan technical handbooks.
    """
    try:
        resources = await db.get_all_guidance_resources(category=category)
        return resources
    except Exception as e:
        logger.error(f"Error listing guidance resources: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve guidance resources.")

@router.get("/resources/{resource_id}", response_model=GuidanceResourceResponse)
async def get_guidance_resource_endpoint(resource_id: str):
    """
    Retrieves full content of a specific guidance roadmap or handbook.
    """
    try:
        resource = await db.get_guidance_resource(resource_id)
        if not resource:
            raise HTTPException(status_code=404, detail="Guidance resource not found.")
        return resource
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching resource {resource_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve resource.")

def _generate_expert_deterministic_counseling(query: str, branch: str, qual: str) -> Dict[str, Any]:
    """
    Comprehensive multi-domain deterministic counselor engine providing rich, actionable,
    domain-specific roadmaps and milestones across 12+ technical disciplines.
    """
    q_lower = query.lower()
    
    # 1. AI, Data Science & Product Management
    if any(k in q_lower for k in ["product", "ai product", "product manager", "pm", "ai engineer", "data science", "machine learning", "llm", "ai"]):
        answer = (
            f"### Career Roadmap: AI & Technical Product Management for {qual} ({branch})\n\n"
            "Transitioning into **AI & Modern Product Roles** requires bridging technical depth with user empathy and business execution:\n\n"
            "1. **Core AI Product Fundamentals**:\n"
            "   - Master the difference between traditional software and probabilistic AI systems (precision/recall trade-offs, model latency, context windows, and hallucination guardrails).\n"
            "   - Understand how LLM APIs (Gemini, OpenAI), Vector Databases (ChromaDB, Pinecone), and agentic workflows (RAG, tool-calling) operate.\n\n"
            "2. **Product Execution & Delivery Skills**:\n"
            "   - Write structured PRDs (Product Requirement Documents) defining user personas, success metrics (Retention, CSAT, Time-to-Value), and phased milestone roadmaps.\n"
            "   - Conduct user interviews and usability audits; create interactive wireframes in Figma.\n\n"
            "3. **Portfolio & Proof-of-Work Strategy**:\n"
            "   - Build and ship 2 end-to-end AI applications (e.g. an AI resume forensic auditor or state service bot) and document the product teardown on GitHub and LinkedIn.\n"
            "   - Highlight measurable outcomes on your resume: *'Shipped automated parsing pipeline reducing candidate screening turnaround by 75%'*.\n\n"
            "4. **Target Opportunities in Rajasthan & Tier-1 Ecosystems**:\n"
            "   - Rajasthan DOIT&C AI initiatives, Jaipur Tech SEZ companies (Genpact, Celebal Technologies, Infosys), and high-growth remote tech startups."
        )
        actionable_steps = [
            "Build and document a full-stack AI prototype product with a published PRD",
            "Complete free Google Cloud AI / Gemini Foundations certification on Coursera or SkillsBoost",
            "Optimize your resume with quantified metric achievements instead of generic duty listings",
            "Apply to AI Product Specialist and Associate PM openings on the Hiring Wallah portal"
        ]

    # 2. Electrical, Renewable Energy & Power Systems
    elif any(k in q_lower for k in ["solar", "renewable", "electrical", "power", "grid", "scada", "substation", "bhadla"]):
        answer = (
            f"### Career Roadmap: Electrical & Renewable Energy Engineering ({qual} - {branch})\n\n"
            "Rajasthan is India's premier clean energy hub (home to the 2,245 MW Bhadla Solar Park and extensive RVUNL/RVPN transmission corridors):\n\n"
            "1. **High-Demand Technical Competencies**:\n"
            "   - **Solar PV Design & Modeling**: Master PVsyst, Helioscope, and AutoCAD electrical single-line diagrams (SLDs).\n"
            "   - **Substation Automation**: Learn PLC programming (Siemens/Allen-Bradley), SCADA architecture, and IEC 61850 communication protocols.\n"
            "   - **Grid Integration**: Power distribution telemetry, inverter stations, and smart grid harmonic analysis.\n\n"
            "2. **Target State & PSU Recruiters**:\n"
            "   - **State Entities**: RVUNL (Generation), RVPN (Transmission), JVVNL/AVVNL/JdVVNL (Distribution), and RRECL (Rajasthan Renewable Energy Corp).\n"
            "   - **Private EPC Titans**: Tata Power Solar, Adani Green Energy, Sterling & Wilson, and Larsen & Toubro Power.\n\n"
            "3. **Certification & Hands-on Training**:\n"
            "   - Complete National Institute of Solar Energy (NISE) Suryamitra or SCADA industrial training at Rajasthan DISCOM training centers."
        )
        actionable_steps = [
            "Enroll in NPTEL / AICTE certified Solar Photovoltaic & Substation Automation course",
            "Practice modeling 500kW+ solar single-line diagrams in AutoCAD Electrical",
            "Download the official RVUNL Junior Engineer exam syllabus and start technical revision",
            "Apply to verified Renewable EPC and Transmission vacancies on the Opportunities Hub"
        ]

    # 3. Polytechnic, Diploma & Lateral Entry (LEET)
    elif any(k in q_lower for k in ["polytechnic", "diploma", "lateral entry", "leet", "b.tech", "degree"]):
        answer = (
            f"### Polytechnic to B.Tech & High-Paying Employment Pathways ({qual} - {branch})\n\n"
            "As a Rajasthan Polytechnic Diploma holder, you hold a distinct competitive edge with strong practical lab foundations:\n\n"
            "1. **Rajasthan Lateral Entry (LEET) Admissions**:\n"
            "   - Direct admission into 2nd year (3rd semester) B.Tech programs across premier government colleges:\n"
            "     - **RTU Kota, MBM University Jodhpur, CTAE Udaipur, Engineering College Ajmer, EC Bikaner**.\n"
            "   - Eligibility: Minimum 45% aggregate in 3-year Diploma (40% for reserved categories). Counseling managed by HTE Rajasthan.\n\n"
            "2. **Immediate Technical Government Jobs (Pay Level 10)**:\n"
            "   - **RSSB Junior Engineer (JEN)**: Civil, Electrical, Mechanical branches.\n"
            "   - **Railway Recruitment Board (RRB JE)** and SSC JE (Central CPWD/MES).\n\n"
            "3. **Overseas Industrial Apprenticeships (TITP Japan)**:\n"
            "   - Rajasthan Technical Education Department sponsors polytechnic graduates for 3-5 year technical placements in Tokyo/Nagoya with monthly stipends of ₹1.4L–₹1.8L."
        )
        actionable_steps = [
            "Track the official LEET counseling portal on dte.rajasthan.gov.in / hte.rajasthan.gov.in",
            "Begin foundational Japanese (N5) if targeting overseas Japan TITP technical placement",
            "Assemble your semester marksheets, diploma certificate, and AICTE industrial training logbook",
            "Book a 1-on-1 session with a certified Rajasthan Polytechnic Career Advisor"
        ]

    # 4. Rajasthan Government Technical Exams
    elif any(k in q_lower for k in ["govt", "rpsc", "rvunl", "rssb", "jen", "aen", "exam", "sarkari", "syllabus"]):
        answer = (
            f"### Strategic Preparation Guide for Rajasthan Technical Exams ({qual} - {branch})\n\n"
            "Rajasthan technical recruitment exams feature a standardized, predictable scoring rubric:\n\n"
            "1. **Syllabus & Weightage Breakdown**:\n"
            "   - **Section A (Technical Domain - 60% to 70%)**: Core subjects of your engineering discipline (Circuit Theory, Machines, Thermodynamics, Surveying, Data Structures).\n"
            "   - **Section B (Rajasthan General Studies - 30% to 40%)**: Rajasthan History, Art & Culture, Geography, Economy, Administrative Setup, and State Current Affairs.\n\n"
            "2. **High-Impact Upcoming State Notifications**:\n"
            "   - **RVUNL / RVPN AEN & JEN**: State Power Transmission & Generation Companies.\n"
            "   - **RSSB JEN (Civil/Electrical/Mechanical)**: PWD, PHED, WRD departments.\n"
            "   - **DOIT&C Informatics Assistant & Programmer**: State IT Infrastructure & e-Governance.\n\n"
            "3. **Proven 4-Month Study Schedule**:\n"
            "   - *Month 1-2*: Deep concept review with standard reference textbooks & notes.\n"
            "   - *Month 3*: Rajasthan GK master revision & 5-year previous year question papers (PYQs).\n"
            "   - *Month 4*: 30+ full-length computer-based mock tests with negative marking calibration."
        )
        actionable_steps = [
            "Download previous 5-year question papers for your branch from the RPSC / RSSB portal",
            "Dedicate 90 minutes daily specifically to Rajasthan History, Geography & Art Culture",
            "Practice 60 timed technical multiple-choice questions every morning",
            "Take weekly full-length mock tests to minimize negative marking errors"
        ]

    # 5. Software Engineering & Full Stack
    elif any(k in q_lower for k in ["software", "web", "frontend", "backend", "full stack", "react", "python", "java", "coding"]):
        answer = (
            f"### Modern Software Engineering & Cloud Roadmap ({qual} - {branch})\n\n"
            "To secure top software engineering roles in both Rajasthan Tech SEZs and national tech hubs:\n\n"
            "1. **Core Problem Solving & CS Foundations**:\n"
            "   - Master Data Structures & Algorithms in Python, Java, or C++ (Arrays, Hash Maps, Trees, Graphs, Dynamic Programming).\n"
            "   - Practice standard LeetCode / HackerRank problems to pass automated technical screening rounds.\n\n"
            "2. **Production Full-Stack Architecture**:\n"
            "   - **Frontend**: Next.js 15+, TypeScript, TailwindCSS, React State Management.\n"
            "   - **Backend**: FastAPI / Node.js, PostgreSQL / SQLite, REST & GraphQL endpoints, Authentication (JWT, Firebase Auth).\n"
            "   - **DevOps**: Docker containerization, GitHub Actions CI/CD pipelines, Cloud Deployment (Vercel, AWS, GCP).\n\n"
            "3. **Recruiter Proof-of-Work**:\n"
            "   - Deploy 2 live production web applications with public URLs and clean GitHub code repositories."
        )
        actionable_steps = [
            "Build and deploy a full-stack web application with user auth and database persistence",
            "Solve 1-2 algorithmic coding challenges daily on LeetCode / GeeksForGeeks",
            "Write a clean README with architecture diagrams and API documentation for your projects",
            "Run an AI resume audit on Hiring Wallah to check ATS keyword and evidence alignment"
        ]

    # 6. Default Comprehensive Technical Guidance
    else:
        answer = (
            f"### Personalized Technical Career Guidance for {qual} ({branch})\n\n"
            f"Addressing your query: *\"{query}\"*\n\n"
            "Here is your structured action plan tailored to the Rajasthan Technical Education Ecosystem:\n\n"
            "1. **Identify Your Primary High-Growth Channel**:\n"
            "   - **Private Technology Placements**: Core industry engineering and IT solutions hubs across Jaipur, Kota, and NCR.\n"
            "   - **Rajasthan State Government Technical Services**: RSSB JEN, RVUNL Assistant Engineer, and DOIT&C technical cadres.\n"
            "   - **Mandatory AICTE Industrial Internships**: Practical project credit training at state research parks and DISCOMs.\n"
            "   - **Global Overseas Mobility**: Japan TITP and European vocational apprenticeships.\n\n"
            "2. **Skill-Gap Elimination Strategy**:\n"
            "   - Cross-reference your current resume against live Rajasthan employer requirements.\n"
            "   - Build concrete project evidence to demonstrate applied competence rather than self-reported buzzwords.\n\n"
            "3. **State Guidance & Industry Mentorship Support**:\n"
            "   - Connect directly with state polytechnic counselors and alumni mentors on the Hiring Wallah platform."
        )
        actionable_steps = [
            "Run a free Skill-Gap Analysis against your target job title on the Candidate Studio",
            "Explore verified multi-sector opportunities matching your branch and qualification",
            "Book a 1-on-1 video guidance session with a certified Technical Education Counselor",
            "Connect with an active industry mentor from your domain on the Mentorship portal"
        ]

    return {
        "answer": answer,
        "actionable_steps": actionable_steps
    }

@router.post("/ai-copilot", response_model=AICounselorQueryResponse)
async def ai_career_copilot_endpoint(payload: AICounselorQueryRequest):
    """
    Conversational AI Career Counselor specialized in Rajasthan Technical Education pathways,
    polytechnic-to-degree transition, govt technical exams, and internship readiness.
    Uses Gemini multimodal AI with intelligent domain-aware deterministic fallback.
    """
    try:
        query = payload.query.strip()
        branch = payload.student_branch or "Engineering / Polytechnic"
        qual = payload.qualification or "B.Tech / Diploma"
        q_lower = query.lower()

        answer = ""
        actionable_steps = []

        # 1. Attempt generation via Gemini if configured
        if gemini_client.api_key:
            try:
                system_prompt = (
                    "You are the Official AI Career Counselor for the Technical Education Department, Government of Rajasthan (Smart India Hackathon SIH1632).\n"
                    "Your goal is to provide deeply knowledgeable, encouraging, concrete, and highly actionable career guidance for technical students in Rajasthan.\n"
                    "Context:\n"
                    f"- Student Branch: {branch}\n"
                    f"- Student Qualification: {qual}\n"
                    f"- Student Query: {query}\n\n"
                    "Guidelines:\n"
                    "1. Address the specific question directly with high technical precision (e.g. if asking about AI product management, electrical renewable energy, govt exams, lateral entry, provide explicit roadmaps, tools, exams, and milestones).\n"
                    "2. Structure your answer using clean markdown with bold section headings, bullet points, and realistic timelines.\n"
                    "3. Highlight specific Rajasthan opportunities, PSUs (RVUNL, RPSC, RSSB), solar parks (Bhadla), IT hubs (Jaipur, Kota), or TITP Japan where applicable.\n"
                    "4. Return exactly 4 concrete, actionable steps the student should take next.\n\n"
                    "Return a valid JSON object with the following exact schema:\n"
                    "{\n"
                    '  "answer": "string containing comprehensive markdown guidance",\n'
                    '  "actionable_steps": ["Step 1", "Step 2", "Step 3", "Step 4"]\n'
                    "}"
                )
                raw_json = await gemini_client.generate(system_prompt)
                parsed = json.loads(raw_json)
                answer = parsed.get("answer") or ""
                actionable_steps = parsed.get("actionable_steps") or []
            except Exception as e:
                logger.warning(f"Gemini AI Career Copilot call failed ({e}). Falling back to expert deterministic engine.")
                answer = ""
                actionable_steps = []

        # 2. Fallback to expert deterministic knowledge engine if Gemini was unconfigured or failed
        if not answer:
            det_res = _generate_expert_deterministic_counseling(query, branch, qual)
            answer = det_res["answer"]
            actionable_steps = det_res["actionable_steps"]

        # 3. Fetch real matching opportunities from the database based on query & branch
        all_opps = await db.get_all_opportunities(limit=50)
        
        # Filter opportunities by relevance to query keywords and branch
        def _opp_score(opp):
            score = 0
            title = (opp.get("title") or "").lower()
            desc = (opp.get("description") or "").lower()
            opp_branch = (opp.get("branch") or "").lower()
            sector = (opp.get("sector") or "").lower()
            
            # Match query words
            for word in q_lower.split():
                if len(word) > 3:
                    if word in title:
                        score += 5
                    if word in desc:
                        score += 2
                    if word in opp_branch:
                        score += 4
            
            # Match student branch
            if branch.lower() in opp_branch or "all" in opp_branch or opp_branch in branch.lower():
                score += 3
            return score

        scored_opps = sorted(all_opps, key=_opp_score, reverse=True)
        recommended_opps = scored_opps[:3] if scored_opps else all_opps[:3]

        # 4. Fetch related guidance resources from database
        res_list = await db.get_all_guidance_resources()
        related_resources = res_list[:2] if res_list else []

        return {
            "answer": answer,
            "recommended_opportunities": recommended_opps,
            "actionable_steps": actionable_steps,
            "related_resources": related_resources
        }
    except Exception as e:
        logger.error(f"Error in AI Career Copilot: {e}")
        raise HTTPException(status_code=500, detail="AI Career Copilot encountered an error.")
