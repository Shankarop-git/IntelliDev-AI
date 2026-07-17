"""
Chat API router.
Exposes REST + SSE streaming endpoints consumed by the Next.js frontend.
All AI logic is delegated to ChatService; this layer only handles HTTP.
"""

from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.chat.chat_service import chat_service
from app.services.llm.provider_factory import AVAILABLE_MODELS
from app.services.llm.gemini_provider import GeminiProvider

router = APIRouter()


# ─── Request / Response Schemas ────────────────────────────────────────────

class Message(BaseModel):
    role: str       # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    model: str = "gemini:gemini-2.5-flash"
    temperature: float = 0.7
    system_prompt: Optional[str] = (
        "You are IntelliDev AI, an expert software engineering assistant. "
        "You write clean, well-commented code and explain concepts clearly."
    )


class TestKeyRequest(BaseModel):
    model: Optional[str] = None


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/models")
async def list_models():
    """Return the full list of available LLM models."""
    return {"models": AVAILABLE_MODELS}


@router.post("/test-key")
async def test_api_key(
    body: Optional[TestKeyRequest] = None,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """
    Validate a Gemini API key by making a real request to the Gemini API.
    Never rejects based on key format — only the actual API response matters.

    Response statuses:
      - success           → key valid, model responded
      - invalid_key       → 401 Unauthenticated from Google
      - forbidden         → 403 from Google
      - model_unavailable → 404 from Google (no supported model found)
      - rate_limited      → 429 from Google
      - error             → any other failure
    """
    if not x_gemini_api_key or not x_gemini_api_key.strip():
        return {"status": "error", "message": "No API key provided"}

    provider = GeminiProvider(api_key=x_gemini_api_key)

    # Clean model if provided (e.g. gemini:gemini-2.5-flash -> gemini-2.5-flash)
    selected_model = None
    if body and body.model:
        selected_model = body.model.strip().split(":")[-1]

    # Models to try in order. Try the user's selected model first.
    models_to_try = []
    if selected_model:
        models_to_try.append(selected_model)

    fallbacks = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
    for fb in fallbacks:
        if fb not in models_to_try:
            models_to_try.append(fb)

    last_error = ""
    for model in models_to_try:
        try:
            response = await provider.chat(
                messages=[{"role": "user", "content": "Hello"}],
                model=model,
                max_tokens=20,
            )
            return {
                "status": "success",
                "message": f"Connected successfully using {model}",
                "model": model,
                "preview": response[:120],
            }
        except Exception as e:
            last_error = str(e)
            err_lower = last_error.lower()
            if "401" in last_error or "invalid api key" in err_lower or "unauthenticated" in err_lower:
                return {"status": "invalid_key", "message": f"Invalid API key — {last_error}"}
            if "403" in last_error or "permission" in err_lower:
                return {"status": "forbidden", "message": f"Permission denied — {last_error}"}
            if "429" in last_error:
                return {"status": "rate_limited", "message": "Rate limit exceeded — wait a moment and retry"}
            # 404 = model not found, try the next one
            continue

    if "404" in last_error or "not found" in last_error.lower():
        return {"status": "model_unavailable", "message": "No supported Gemini models available for this key"}
    return {"status": "error", "message": f"Connection error: {last_error}"}


@router.post("/complete")
async def complete(
    body: ChatRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
    x_groq_api_key: Optional[str] = Header(default=None, alias="X-Groq-Api-Key"),
):
    """
    Non-streaming single completion.
    Used for short responses where streaming is not needed.
    """
    try:
        response = await chat_service.complete(
            messages=[m.model_dump() for m in body.messages],
            model=body.model,
            gemini_api_key=x_gemini_api_key,
            groq_api_key=x_groq_api_key,
            temperature=body.temperature,
            system_prompt=body.system_prompt,
        )
        return {"response": response}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI provider error: {str(e)}")


@router.post("/stream")
async def stream(
    body: ChatRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
    x_groq_api_key: Optional[str] = Header(default=None, alias="X-Groq-Api-Key"),
):
    """
    Server-Sent Events streaming endpoint.
    The frontend consumes this with EventSource or fetch() + ReadableStream.
    Each chunk is sent as: data: <text>\\n\\n
    A final  data: [DONE]\\n\\n  signals completion.
    """

    async def event_generator():
        try:
            async for chunk in chat_service.stream_completion(
                messages=[m.model_dump() for m in body.messages],
                model=body.model,
                gemini_api_key=x_gemini_api_key,
                groq_api_key=x_groq_api_key,
                temperature=body.temperature,
                system_prompt=body.system_prompt,
            ):
                # Escape newlines so SSE stays well-formed
                safe_chunk = chunk.replace("\n", "\\n")
                yield f"data: {safe_chunk}\n\n"
        except ValueError as e:
            yield f"data: [ERROR] {str(e)}\n\n"
        except Exception as e:
            yield f"data: [ERROR] Provider error: {str(e)}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for streaming
        },
    )
