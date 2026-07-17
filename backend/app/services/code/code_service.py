"""
Code Studio service.
Handles all developer productivity operations:
  - Generate code from a natural-language prompt
  - Explain code
  - Debug code (detect bugs, suggest fixes)
  - Review code (quality, best practices, security)
  - Refactor code
  - Optimize code for performance
  - Translate code between programming languages
  - Generate REST API boilerplate
  - Generate SQL queries

All operations call the LLM provider directly (no LangChain) and return
structured responses. System prompts are tuned per-operation so the model
focuses on the right output format.
"""

from app.services.chat.chat_service import chat_service

# ─── System Prompt Templates ────────────────────────────────────────────────

_BASE_SYSTEM = """You are IntelliDev AI, an expert software engineer with deep knowledge of \
multiple programming languages, algorithms, system design, and software best practices. \
Respond concisely. Always wrap code in fenced markdown code blocks with the correct language tag."""

_PROMPTS: dict[str, str] = {
    "generate": (
        "{_BASE_SYSTEM}\n"
        "Generate clean, production-quality {language} code for the following requirement. "
        "Include comments explaining the key parts."
    ),
    "explain": (
        "{_BASE_SYSTEM}\n"
        "Explain the following {language} code clearly. "
        "Break it down step by step. Mention the purpose, logic flow, and any noteworthy patterns."
    ),
    "debug": (
        "{_BASE_SYSTEM}\n"
        "You are a debugging expert. Analyze the following {language} code or error message. "
        "Identify all bugs and issues. Explain the root cause of each bug and provide a corrected version."
    ),
    "review": (
        "{_BASE_SYSTEM}\n"
        "Perform a thorough code review of the following {language} code. Cover:\n"
        "1. Code quality and readability\n"
        "2. Potential bugs or logic errors\n"
        "3. Security vulnerabilities\n"
        "4. Performance improvements\n"
        "5. Best practices and design patterns\n"
        "Be specific with line references and improvement suggestions."
    ),
    "refactor": (
        "{_BASE_SYSTEM}\n"
        "Refactor the following {language} code to improve readability, maintainability, "
        "and adherence to best practices. Preserve the original functionality. "
        "Explain the key changes made."
    ),
    "optimize": (
        "{_BASE_SYSTEM}\n"
        "Optimize the following {language} code for performance. "
        "Focus on algorithmic complexity, memory usage, and runtime efficiency. "
        "Explain the optimizations applied and their impact."
    ),
    "translate": (
        "{_BASE_SYSTEM}\n"
        "Translate the following code from {source_language} to {target_language}. "
        "Preserve the logic exactly. Use idiomatic {target_language} patterns and style."
    ),
    "generate_api": (
        "{_BASE_SYSTEM}\n"
        "Generate a complete {language} REST API for the following specification. "
        "Include route definitions, request/response models, input validation, "
        "error handling, and brief usage comments."
    ),
    "generate_sql": (
        "{_BASE_SYSTEM}\n"
        "Generate SQL for the following requirement. "
        "Write clean, optimized SQL queries with comments. "
        "If schema creation is needed, include CREATE TABLE statements."
    ),
    "explain_error": (
        "{_BASE_SYSTEM}\n"
        "Explain the following compiler/runtime error in {language}. "
        "State: 1) what caused it, 2) how to fix it, 3) how to prevent it in the future. "
        "Provide a corrected code snippet if applicable."
    ),
}


class CodeService:
    """
    Dispatches all Code Studio operations.
    Each method builds a system prompt and one user message, then calls
    the shared chat_service.complete() (non-streaming) or
    chat_service.stream_completion() (streaming) as needed.
    """

    def _build_messages(self, user_content: str) -> list[dict]:
        return [{"role": "user", "content": user_content}]

    def _system(self, key: str, **kwargs) -> str:
        template = _PROMPTS[key]
        return template.format(_BASE_SYSTEM=_BASE_SYSTEM, **kwargs)

    # ── Non-streaming helpers (used internally and for short responses) ──────

    async def generate(
        self, prompt: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(prompt),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("generate", language=language),
        )

    async def explain(
        self, code: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(code),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("explain", language=language),
        )

    async def debug(
        self, code: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(code),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("debug", language=language),
        )

    async def review(
        self, code: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(code),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("review", language=language),
        )

    async def refactor(
        self, code: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(code),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("refactor", language=language),
        )

    async def optimize(
        self, code: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(code),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("optimize", language=language),
        )

    async def translate(
        self,
        code: str,
        source_language: str,
        target_language: str,
        model: str,
        gemini_key: str | None,
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(code),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system(
                "translate",
                source_language=source_language,
                target_language=target_language,
            ),
        )

    async def generate_api(
        self, spec: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(spec),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("generate_api", language=language),
        )

    async def generate_sql(
        self, requirement: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(requirement),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("generate_sql"),
        )

    async def explain_error(
        self, error: str, language: str, model: str, gemini_key: str | None
    ) -> str:
        return await chat_service.complete(
            messages=self._build_messages(error),
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=self._system("explain_error", language=language),
        )


# Module-level singleton
code_service = CodeService()
