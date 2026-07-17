"""
Chat service.
Handles conversation management: creating chats, listing messages,
streaming completions, and persisting history. Decoupled from the HTTP
layer so it can be used from any router or background task.
"""

from typing import AsyncIterator
from app.services.llm.provider_factory import get_provider, resolve_model_name


class ChatService:
    """All business logic for the AI Chat Assistant module."""

    async def stream_completion(
        self,
        messages: list[dict],
        model: str,
        gemini_api_key: str | None = None,
        groq_api_key: str | None = None,
        temperature: float = 0.7,
        system_prompt: str | None = None,
    ) -> AsyncIterator[str]:
        """
        Stream a chat completion using the appropriate LLM provider.
        """
        provider = get_provider(
            model=model,
            gemini_api_key=gemini_api_key,
            groq_api_key=groq_api_key,
        )
        bare_model = resolve_model_name(model)

        # Prepend system prompt if provided
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        async for chunk in provider.stream_chat(
            messages=full_messages,
            model=bare_model,
            temperature=temperature,
        ):
            yield chunk

    async def complete(
        self,
        messages: list[dict],
        model: str,
        gemini_api_key: str | None = None,
        groq_api_key: str | None = None,
        temperature: float = 0.7,
        system_prompt: str | None = None,
    ) -> str:
        """
        Non-streaming single-turn completion. Used for background tasks
        and programmatic code generation calls.
        """
        provider = get_provider(
            model=model,
            gemini_api_key=gemini_api_key,
            groq_api_key=groq_api_key,
        )
        bare_model = resolve_model_name(model)

        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        return await provider.chat(
            messages=full_messages,
            model=bare_model,
            temperature=temperature,
        )


# Module-level singleton – share one instance across the app lifecycle
chat_service = ChatService()
