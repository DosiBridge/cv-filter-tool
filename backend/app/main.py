from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CV Filter Tool API",
    description="API for filtering and matching CVs against job requirements",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "CV Filter Tool API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

