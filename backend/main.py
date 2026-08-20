import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.recruiter import router as recruiter_router
from app.api.candidate import router as candidate_router
from app.api.jobs import router as jobs_router
from app.api.auth import router as auth_router
from app.api.learning import router as learning_router
from app.api.simulation import router as simulation_router
from app.api.executive import router as executive_router
from app.api.opportunities import router as opportunities_router
from app.api.matchmaking import router as matchmaking_router
from app.api.counseling import router as counseling_router
from app.api.mentorship import router as mentorship_router
from app.api.analytics import router as analytics_router
import logging

logger = logging.getLogger("hiring_wallah.main")

from contextlib import asynccontextmanager
import asyncio
from app.agents.worker import worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the worker loop as a background task
    worker_task = asyncio.create_task(worker.start())
    yield
    # Stop the worker loop on shutdown
    await worker.stop()
    await worker_task

app = FastAPI(
    title="Hiring Wallah - SIH1632 Backend API",
    description="Interactive Job, Internship, Counseling & AI Career Matching Platform for Technical Education Department, Govt. of Rajasthan.",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(recruiter_router)
app.include_router(candidate_router)
app.include_router(jobs_router)
app.include_router(auth_router)
app.include_router(learning_router)
app.include_router(simulation_router)
app.include_router(executive_router)

# SIH1632 Technical Education Platform Routers
app.include_router(opportunities_router)
app.include_router(matchmaking_router)
app.include_router(counseling_router)
app.include_router(mentorship_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Hiring Wallah Backend API - SIH1632",
        "initiative": "Technical Education Department, Govt. of Rajasthan",
        "version": "2.0.0",
        "modules": [
            "Opportunities Hub (Private, Govt, Overseas, Internships, Industrial Training)",
            "AI Matchmaking & Explainable Fit Scoring",
            "Skill-Gap & Career Intelligence",
            "Counseling Services & Career Roadmaps",
            "Industry & Alumni Mentorship",
            "Technical Education Department Analytics"
        ]
    }

if __name__ == "__main__":
    logger.info("Starting Hiring Wallah backend service...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
