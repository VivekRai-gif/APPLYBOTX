from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, files, ai, email, templates
from app.models.database import Base
from app.database import engine
from app.config import settings
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ApplyBotX API",
    description="AI-powered job application email generator",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(email.router, prefix="/api/v1/email", tags=["Email"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["Templates"])

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

@app.get("/")
async def root():
    return {"message": "ApplyBotX API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    # Add parent directory to Python path for relative imports
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)