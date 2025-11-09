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

# CORS middleware - Read from environment or use defaults
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
# Parse comma-separated origins or JSON array
if cors_origins_str.startswith("[") and cors_origins_str.endswith("]"):
    # JSON array format
    import json
    try:
        cors_origins = json.loads(cors_origins_str)
    except json.JSONDecodeError:
        cors_origins = cors_origins_str.split(",")
else:
    # Comma-separated format
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

