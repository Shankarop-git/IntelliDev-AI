"""
Provider factory.
Resolves which LLM provider to use based on the model string prefix.
This is the single point of entry for all module code that needs an LLM.
"""

from app.services.llm.base import LLMProvider
from app.services.llm.ollama_provider import OllamaProvider
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.groq_provider import GroqProvider


def get_provider(
    model: str,
    gemini_api_key: str | None = None,
    groq_api_key: str | None = None,
) -> LLMProvider:
    """
    Factory function that resolves the correct provider from a model name.

    Model name convention:
      - "ollama:llama3"        → OllamaProvider
      - "gemini:gemini-2.0-flash" → GeminiProvider
      - "groq:llama-3.3-70b-versatile" → GroqProvider
      - Bare names like "llama3" → OllamaProvider (default)
    """
    model = model.strip().lower()

    if model.startswith("gemini:") or model.startswith("gemini-"):
        if not gemini_api_key:
            raise ValueError(
                "A Gemini API key is required. Please add it in Settings."
            )
        return GeminiProvider(api_key=gemini_api_key)

    if model.startswith("groq:") or model.startswith("groq-"):
        return GroqProvider(api_key=groq_api_key)

    # Default to Ollama for everything else
    return OllamaProvider()


def resolve_model_name(model: str) -> str:
    """Strip the provider prefix to get the bare model name for the API call."""
    if ":" in model:
        return model.split(":", 1)[1]
    return model


AVAILABLE_MODELS = [
    {"id": "groq:llama-3.3-70b-versatile", "name": "Llama 3.3 70B (Groq Cloud)", "provider": "groq"},
    {"id": "groq:llama-3.1-8b-instant", "name": "Llama 3.1 8B (Groq Cloud)", "provider": "groq"},
    {"id": "groq:mixtral-8x7b-32768", "name": "Mixtral 8x7B (Groq Cloud)", "provider": "groq"},
    {"id": "groq:gemma2-9b-it", "name": "Gemma 2 9B (Groq Cloud)", "provider": "groq"},
    {"id": "ollama:llama3", "name": "Llama 3 (Local)", "provider": "ollama"},
    {"id": "ollama:llama3:8b", "name": "Llama 3 8B (Local)", "provider": "ollama"},
    {"id": "ollama:codellama", "name": "CodeLlama (Local)", "provider": "ollama"},
    {"id": "ollama:mistral", "name": "Mistral (Local)", "provider": "ollama"},
    {"id": "ollama:phi3", "name": "Phi-3 (Local)", "provider": "ollama"},
]
