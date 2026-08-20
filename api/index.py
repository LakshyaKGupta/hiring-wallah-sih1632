import sys
import os
from fastapi import FastAPI

# Add the backend directory to the Python path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from main import app as backend_app

# Vercel Serverless Function entrypoint
app = FastAPI()

# Mount the backend app under /api so that Vercel rewrites map correctly
app.mount("/api", backend_app)
