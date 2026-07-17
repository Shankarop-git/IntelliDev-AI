"""
Code Studio API router.
Exposes all Code Studio operations as clean REST endpoints.
The frontend calls these from the Code Studio page.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.services.code.code_service import code_service

router = APIRouter()


# ─── Request Schemas ────────────────────────────────────────────────────────

class CodeRequest(BaseModel):
    """Base request for single-language code operations."""
    code: str
    language: str = "python"
    model: str = "ollama:llama3"


class GenerateRequest(BaseModel):
    """For natural-language-to-code generation."""
    prompt: str
    language: str = "python"
    model: str = "ollama:llama3"


class TranslateRequest(BaseModel):
    """For code translation between languages."""
    code: str
    source_language: str
    target_language: str
    model: str = "ollama:llama3"


class GenerateAPIRequest(BaseModel):
    """For REST API boilerplate generation."""
    spec: str
    language: str = "python"
    model: str = "ollama:llama3"


class GenerateSQLRequest(BaseModel):
    """For SQL query generation."""
    requirement: str
    model: str = "ollama:llama3"


class ErrorRequest(BaseModel):
    """For compiler/runtime error explanation."""
    error: str
    language: str = "python"
    model: str = "ollama:llama3"


# ─── Shared header extractor ─────────────────────────────────────────────────

def _gemini_key(header: Optional[str]) -> Optional[str]:
    return header or None


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_code(
    body: GenerateRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Generate code from a natural-language prompt."""
    try:
        result = await code_service.generate(
            body.prompt, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "generate", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain")
async def explain_code(
    body: CodeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Explain what a piece of code does."""
    try:
        result = await code_service.explain(
            body.code, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "explain", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug")
async def debug_code(
    body: CodeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Detect bugs and suggest fixes."""
    try:
        result = await code_service.debug(
            body.code, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "debug", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review")
async def review_code(
    body: CodeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Review code quality, security, and best practices."""
    try:
        result = await code_service.review(
            body.code, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "review", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refactor")
async def refactor_code(
    body: CodeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Refactor code for readability and maintainability."""
    try:
        result = await code_service.refactor(
            body.code, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "refactor", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_code(
    body: CodeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Optimize code for performance."""
    try:
        result = await code_service.optimize(
            body.code, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "optimize", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate")
async def translate_code(
    body: TranslateRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Translate code from one language to another."""
    try:
        result = await code_service.translate(
            body.code,
            body.source_language,
            body.target_language,
            body.model,
            _gemini_key(x_gemini_api_key),
        )
        return {
            "result": result,
            "operation": "translate",
            "source_language": body.source_language,
            "target_language": body.target_language,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-api")
async def generate_api(
    body: GenerateAPIRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Generate REST API boilerplate from a specification."""
    try:
        result = await code_service.generate_api(
            body.spec, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "generate_api", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-sql")
async def generate_sql(
    body: GenerateSQLRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Generate SQL queries from a natural-language requirement."""
    try:
        result = await code_service.generate_sql(
            body.requirement, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "generate_sql"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-error")
async def explain_error(
    body: ErrorRequest,
    x_gemini_api_key: Optional[str] = Header(default=None, alias="X-Gemini-Api-Key"),
):
    """Explain and fix a compiler or runtime error."""
    try:
        result = await code_service.explain_error(
            body.error, body.language, body.model, _gemini_key(x_gemini_api_key)
        )
        return {"result": result, "operation": "explain_error", "language": body.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Code Execution ──────────────────────────────────────────────────────────

import asyncio
import sys
import shutil
import tempfile
import os
import time
import subprocess
import re

def _get_fresh_env():
    """Return a copy of os.environ with the machine + user PATH fully loaded.
    This is needed because newly installed tools (e.g. g++ via winget) update
    the registry PATH, but the server process still has the old PATH in memory."""
    import winreg
    env = os.environ.copy()
    paths = []
    try:
        # Read machine-level PATH from registry
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                            r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment") as k:
            paths.append(winreg.QueryValueEx(k, "Path")[0])
    except Exception:
        pass
    try:
        # Read user-level PATH from registry
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r"Environment") as k:
            paths.append(winreg.QueryValueEx(k, "Path")[0])
    except Exception:
        pass
    if paths:
        env["PATH"] = ";".join(paths)
    return env


def run_sync(cmd: list[str], timeout: float = 10.0, stdin_data: bytes = b""):
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            input=stdin_data if stdin_data else None,
            timeout=timeout,
            env=_get_fresh_env(),
        )
        return proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as e:
        return e.stdout or b"", (e.stderr or b"") + b"\nExecution timed out after 10 seconds.", -1

class ExecuteRequest(BaseModel):
    code: str
    language: str = "python"
    stdin: str = ""  # Optional stdin input for interactive programs


SUPPORTED_LANGUAGES = {
    "python": {"ext": ".py", "cmd": [sys.executable]},
    "javascript": {"ext": ".js", "cmd": ["node"]},
    "typescript": {"ext": ".ts", "cmd": ["npx", "--yes", "ts-node", "--compiler-options", '{"module":"commonjs"}']},
    "go": {"ext": ".go", "cmd": ["go", "run"]},
    "bash": {"ext": ".sh", "cmd": ["bash"]},
}


@router.post("/execute")
async def execute_code(body: ExecuteRequest):
    """
    Execute code in a subprocess and return stdout + stderr.
    Supported languages: Python, JavaScript, TypeScript, Java, C++, Go, Rust, Bash.
    Hard timeout: 10 seconds.
    """
    lang = body.language.lower().strip()
    start_time = time.monotonic()

    # ── Compiled Languages: C++, Rust, Java ──
    if lang in ("c++", "cpp", "rust", "java"):
        # Create a temp directory to build and compile
        temp_dir = tempfile.mkdtemp()
        try:
            # 1. Setup file paths based on language
            if lang in ("c++", "cpp"):
                binary = "g++"
                if shutil.which(binary) is None and shutil.which(binary, path=_get_fresh_env().get("PATH")) is None:
                    return {"stdout": "", "stderr": "Compiler 'g++' not found. Please install GCC/g++ to execute C++ code.", "exit_code": 127, "execution_time": 0, "language": body.language}
                src_path = os.path.join(temp_dir, "main.cpp")
                out_path = os.path.join(temp_dir, "main.exe" if sys.platform == "win32" else "main")
                compile_cmd = ["g++", src_path, "-o", out_path]
                run_cmd = [out_path]

            elif lang == "rust":
                binary = "rustc"
                if shutil.which(binary) is None and shutil.which(binary, path=_get_fresh_env().get("PATH")) is None:
                    return {"stdout": "", "stderr": "Compiler 'rustc' not found. Please install Rust to execute Rust code.", "exit_code": 127, "execution_time": 0, "language": body.language}
                src_path = os.path.join(temp_dir, "main.rs")
                out_path = os.path.join(temp_dir, "main.exe" if sys.platform == "win32" else "main")
                compile_cmd = ["rustc", src_path, "-o", out_path]
                run_cmd = [out_path]

            elif lang == "java":
                # Java requires class name matching filename. Extract it or fallback to Main.
                match = re.search(r"public\s+class\s+(\w+)", body.code)
                class_name = match.group(1) if match else "Main"
                
                # Check for javac and java
                fresh_path = _get_fresh_env().get("PATH")
                if (shutil.which("javac") is None and shutil.which("javac", path=fresh_path) is None) or \
                   (shutil.which("java") is None and shutil.which("java", path=fresh_path) is None):
                    return {"stdout": "", "stderr": "Java SDK ('javac'/'java') not found. Please install JDK to execute Java code.", "exit_code": 127, "execution_time": 0, "language": body.language}
                
                src_path = os.path.join(temp_dir, f"{class_name}.java")
                compile_cmd = ["javac", src_path]
                run_cmd = ["java", "-cp", temp_dir, class_name]

            # 2. Write source file
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(body.code)

            # 3. Compile source code
            c_stdout, c_stderr, c_exit = await asyncio.to_thread(run_sync, compile_cmd, 10.0)

            if c_exit != 0:
                return {
                    "stdout": c_stdout.decode("utf-8", errors="replace"),
                    "stderr": c_stderr.decode("utf-8", errors="replace"),
                    "exit_code": c_exit,
                    "execution_time": round(time.monotonic() - start_time, 3),
                    "language": body.language,
                }

            # 4. Run compiled binary
            stdin_bytes = body.stdin.encode("utf-8") if body.stdin else b""
            stdout_bytes, stderr_bytes, exit_code = await asyncio.to_thread(run_sync, run_cmd, 10.0, stdin_bytes)
            elapsed = round(time.monotonic() - start_time, 3)

            return {
                "stdout": stdout_bytes.decode("utf-8", errors="replace"),
                "stderr": stderr_bytes.decode("utf-8", errors="replace"),
                "exit_code": exit_code,
                "execution_time": elapsed,
                "language": body.language,
            }

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    # ── Interpreted/Scripted Languages (Python, JS, TS, Go, Bash) ──
    if lang not in SUPPORTED_LANGUAGES:
        return {
            "stdout": "",
            "stderr": f"Language '{body.language}' is not supported for execution.\nSupported: Python, JavaScript, TypeScript, Java, C++, Go, Rust, Bash.",
            "exit_code": 1,
            "execution_time": 0,
            "language": body.language,
        }

    lang_config = SUPPORTED_LANGUAGES[lang]
    cmd_binary = lang_config["cmd"][0]

    # Verify the runtime is actually available
    if shutil.which(cmd_binary) is None and not os.path.isabs(cmd_binary):
        return {
            "stdout": "",
            "stderr": f"Runtime not found: '{cmd_binary}'. Please install it to execute {body.language} code.",
            "exit_code": 127,
            "execution_time": 0,
            "language": body.language,
        }

    # Write code to a temp file
    suffix = lang_config["ext"]
    with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(body.code)
        tmp_path = f.name

    try:
        cmd = lang_config["cmd"] + [tmp_path]
        stdin_bytes = body.stdin.encode("utf-8") if body.stdin else b""
        stdout_bytes, stderr_bytes, exit_code = await asyncio.to_thread(run_sync, cmd, 10.0, stdin_bytes)
        elapsed = round(time.monotonic() - start_time, 3)

        return {
            "stdout": stdout_bytes.decode("utf-8", errors="replace"),
            "stderr": stderr_bytes.decode("utf-8", errors="replace"),
            "exit_code": exit_code,
            "execution_time": elapsed,
            "language": body.language,
        }
    finally:
        os.unlink(tmp_path)


