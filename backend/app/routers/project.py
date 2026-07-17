"""
AI Project Explainer API router.
Supports both ZIP uploads and public GitHub repo URLs.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from pydantic import BaseModel
from typing import Optional
from app.services.project.project_explainer_service import project_explainer_service

router = APIRouter()


# ─── Request Schemas ────────────────────────────────────────────────────────

class GitHubExplainerRequest(BaseModel):
    url: str
    model: str = "ollama:llama3"


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/github")
async def explain_github(
    body: GitHubExplainerRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Explain repository architecture from a GitHub URL."""
    try:
        result = await project_explainer_service.analyze_project_github(
            body.url, body.model, x_gemini_api_key
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project explainer error: {str(e)}")


@router.post("/zip")
async def explain_zip(
    file: UploadFile = File(...),
    model: str = Form("ollama:llama3"),
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Explain repository structure from an uploaded ZIP archive."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported.")

    try:
        contents = await file.read()
        result = await project_explainer_service.analyze_project_zip(
            contents, file.filename, model, x_gemini_api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZIP analysis error: {str(e)}")
