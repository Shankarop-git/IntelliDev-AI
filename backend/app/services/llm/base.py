"""
LLM Provider abstract interface.
All providers must implement this interface so switching models
requires zero changes to business logic.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator


class LLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """
        Send a list of messages and return a complete response string.
        messages format: [{"role": "user"|"assistant"|"system", "content": "..."}]
        """
        ...

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """
        Send messages and yield response chunks as they arrive (streaming).
        """
        ...

    @abstractmethod
    def list_models(self) -> list[str]:
        """Return available model names for this provider."""
        ...
