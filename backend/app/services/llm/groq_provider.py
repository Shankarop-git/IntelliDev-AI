"""
Groq provider implementation.
Calls the hosted Groq API (https://api.groq.com/openai/v1) using standard HTTP.
Uses OpenAI-compatible endpoint format.
"""

import httpx
import json
import logging
from typing import AsyncIterator
from app.services.llm.base import LLMProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"


class GroqProvider(LLMProvider):
    """Calls the Groq cloud inference service."""

    DEFAULT_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]

    def __init__(self, api_key: str | None = None):
        """
        Args:
            api_key: User's Groq API key (optional). If not passed,
                     uses the server-configured GROQ_API_KEY from .env.
        """
        settings = get_settings()
        self.api_key = (api_key or settings.GROQ_API_KEY).strip()

    def list_models(self) -> list[str]:
        return self.DEFAULT_MODELS

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(
        self,
        messages: list[dict],
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Non-streaming chat completion via Groq."""
        if not self.api_key:
            raise ValueError("Groq API key not configured.")

        url = f"{GROQ_BASE_URL}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        logger.info(f"[Groq Request] POST {url} | model={model} | messages={len(messages)}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                json=payload,
            )

        logger.info(f"[Groq Response] Status={response.status_code}")

        if response.status_code != 200:
            raise RuntimeError(f"Groq API Error {response.status_code}: {response.text}")

        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def stream_chat(
        self,
        messages: list[dict],
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Streaming chat via Groq."""
        if not self.api_key:
            raise ValueError("Groq API key not configured.")

        url = f"{GROQ_BASE_URL}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        logger.info(f"[Groq Stream Request] POST {url} | model={model} | messages={len(messages)}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                url,
                headers=self._get_headers(),
                json=payload,
            ) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise RuntimeError(f"Groq Stream Error {response.status_code}: {body.decode()}")

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            content = chunk["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
