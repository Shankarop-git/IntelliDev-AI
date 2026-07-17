"""
Gemini provider implementation.

Uses the official google-genai SDK. API key is passed at call time
so users can configure their own key from the Settings page.

Accepts any key format (AIzaSy... or AQ...).
Supports automatic fallback if a requested model is unavailable on the key's billing tier/project.
"""

import logging
from typing import AsyncIterator
from google import genai
from google.genai import types

from app.services.llm.base import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Calls the Google Gemini API using user-supplied API key."""

    DEFAULT_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]

    def __init__(self, api_key: str):
        """
        Args:
            api_key: The user's Gemini API key from settings.
                     Accepts both AQ. (OAuth2) and AIzaSy (API key) formats.
        """
        self.api_key = api_key.strip()
        self.client = genai.Client(api_key=self.api_key)

    def list_models(self) -> list[str]:
        return self.DEFAULT_MODELS

    def _build_contents(self, messages: list[dict]) -> tuple[list, str]:
        """
        Convert OpenAI-style messages to Gemini contents + system instruction.
        Returns (contents, system_instruction).
        """
        contents = []
        system_instruction = ""

        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if role == "system":
                system_instruction = content
            elif role == "user":
                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=content)]))
            elif role == "assistant":
                contents.append(types.Content(role="model", parts=[types.Part.from_text(text=content)]))

        return contents, system_instruction

    async def chat(
        self,
        messages: list[dict],
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Non-streaming chat completion."""
        contents, system_instruction = self._build_contents(messages)
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction if system_instruction else None,
        )

        models_to_try = [model]
        # Keep fallback list of known models
        fallbacks = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
        for fb in fallbacks:
            if fb != model:
                models_to_try.append(fb)

        last_error = None
        for current_model in models_to_try:
            try:
                logger.info(
                    f"[Gemini Request] Model: {current_model} | Temperature: {temperature} | "
                    f"Max Tokens: {max_tokens} | System Instruction: {system_instruction[:100] if system_instruction else None} | "
                    f"Messages: {len(messages)}"
                )

                response = await self.client.aio.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=config,
                )

                logger.info(
                    f"[Gemini Response] Model: {current_model} | Status: Success | "
                    f"Response Text: {response.text[:200]}..."
                )
                return response.text
            except Exception as e:
                last_error = e
                err_msg = str(e).lower()
                logger.warning(
                    f"[Gemini Error] Model {current_model} failed: {str(e)}"
                )
                # Fallback on model not found/available or 0-quota errors
                is_model_error = (
                    "404" in err_msg or
                    "not found" in err_msg or
                    "not supported" in err_msg or
                    "unsupported" in err_msg or
                    "method not found" in err_msg or
                    "not available" in err_msg or
                    "limit: 0" in err_msg
                )
                if is_model_error:
                    logger.info(f"Model {current_model} not available or has 0 quota. Trying next fallback...")
                    continue
                else:
                    raise e

        if last_error:
            raise last_error
        raise RuntimeError("No models succeeded")

    async def stream_chat(
        self,
        messages: list[dict],
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Streaming chat completion."""
        contents, system_instruction = self._build_contents(messages)
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction if system_instruction else None,
        )

        models_to_try = [model]
        fallbacks = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
        for fb in fallbacks:
            if fb != model:
                models_to_try.append(fb)

        last_error = None
        succeeded = False

        for current_model in models_to_try:
            try:
                logger.info(
                    f"[Gemini Stream Request] Model: {current_model} | Temperature: {temperature} | "
                    f"Max Tokens: {max_tokens} | System Instruction: {system_instruction[:100] if system_instruction else None} | "
                    f"Messages: {len(messages)}"
                )

                response_stream = await self.client.aio.models.generate_content_stream(
                    model=current_model,
                    contents=contents,
                    config=config,
                )

                full_response_accum = []
                async for chunk in response_stream:
                    if chunk.text:
                        full_response_accum.append(chunk.text)
                        yield chunk.text

                full_text = "".join(full_response_accum)
                logger.info(
                    f"[Gemini Stream Response] Model: {current_model} | Status: Success | "
                    f"Response Text: {full_text[:200]}..."
                )
                succeeded = True
                break
            except Exception as e:
                last_error = e
                err_msg = str(e).lower()
                logger.warning(
                    f"[Gemini Stream Error] Model {current_model} failed: {str(e)}"
                )
                is_model_error = (
                    "404" in err_msg or
                    "not found" in err_msg or
                    "not supported" in err_msg or
                    "unsupported" in err_msg or
                    "method not found" in err_msg or
                    "not available" in err_msg or
                    "limit: 0" in err_msg
                )
                if is_model_error:
                    logger.info(f"Model {current_model} not available for streaming or has 0 quota. Trying next fallback...")
                    continue
                else:
                    raise e

        if not succeeded and last_error:
            raise last_error
