"""
GitHub Repository Analyzer API router.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.services.github.github_service import github_service

router = APIRouter()


# ─── Request Schemas ────────────────────────────────────────────────────────

class RepoAnalyzeRequest(BaseModel):
    url: str  # e.g., "https://github.com/owner/repo" or "owner/repo"
    model: str = "ollama:llama3"


class RepoQARequest(BaseModel):
    url: str
    question: str
    model: str = "ollama:llama3"


# ─── Helpers ─────────────────────────────────────────────────────────────────

def parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner and repo from a GitHub URL or clone string."""
    clean = url.replace("https://github.com/", "").replace("http://github.com/", "")
    clean = clean.strip("/")
    parts = clean.split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository path. Use format: owner/repo")
    owner = parts[0]
    repo = parts[1].removesuffix(".git")  # strip .git suffix from clone URLs
    return owner, repo


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_repository(
    body: RepoAnalyzeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Scan file tree, detect stack, and summarize repo architecture."""
    try:
        owner, repo = parse_github_url(body.url)
        result = await github_service.analyze_repo(
            owner, repo, body.model, x_gemini_api_key
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub scanner error: {str(e)}")


@router.post("/qa")
async def repository_qa(
    body: RepoQARequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Contextual Q&A over the repository structure."""
    try:
        owner, repo = parse_github_url(body.url)
        answer = await github_service.answer_repo_qa(
            owner, repo, body.question, body.model, x_gemini_api_key
        )
        return {"answer": answer}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Codebase Q&A error: {str(e)}")
