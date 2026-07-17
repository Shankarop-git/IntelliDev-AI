"""
Ollama provider implementation.
Calls the local Ollama API (http://localhost:11434) using standard HTTP.
No SDK dependency – just httpx for clean, lightweight requests.
"""

import httpx
from typing import AsyncIterator
from app.services.llm.base import LLMProvider


OLLAMA_BASE_URL = "http://localhost:11434"


class OllamaProvider(LLMProvider):
    """Calls the locally running Ollama inference server."""

    DEFAULT_MODELS = [
        "llama3",
        "llama3:8b",
        "llama3:70b",
        "codellama",
        "codellama:7b",
        "mistral",
        "gemma2",
        "phi3",
    ]

    def list_models(self) -> list[str]:
        return self.DEFAULT_MODELS

    async def chat(
        self,
        messages: list[dict],
        model: str = "llama3",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Non-streaming chat completion via Ollama /api/chat."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    async def stream_chat(
        self,
        messages: list[dict],
        model: str = "llama3",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Streaming chat via Ollama /api/chat with stream=True."""
        import json

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            if not chunk.get("done", False):
                                content = chunk.get("message", {}).get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
