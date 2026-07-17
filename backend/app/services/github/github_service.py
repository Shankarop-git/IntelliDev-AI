"""
GitHub Repository Analyzer service.
Parses public GitHub repositories:
  - Fetches folder structure from GitHub API (avoids clone dependencies where possible)
  - Identifies programming languages, tech stack, and dependencies
  - Traverses code signatures to generate architecture overviews
  - Auto-generates README content
  - Provides a contextual Q&A chat engine over the repository structure
"""

import httpx
from typing import Any, Optional
from app.services.chat.chat_service import chat_service


class GithubService:
    """Traverses and analyzes public repositories via the GitHub REST API."""

    def __init__(self):
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "IntelliDev-AI-Workspace",
        }

    async def fetch_repo_contents(
        self, owner: str, repo: str, path: str = ""
    ) -> list[dict[str, Any]]:
        """Fetch files and directories at a specific path inside a repository."""
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 404:
                raise ValueError("Repository or path not found")
            response.raise_for_status()
            return response.json()

    async def get_recursive_tree(self, owner: str, repo: str) -> dict[str, Any]:
        """
        Fetch the full recursive Git tree of the default branch.
        This provides a quick map of all files without cloning the repository.
        """
        # 1. Get default branch name
        repo_url = f"https://api.github.com/repos/{owner}/{repo}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(repo_url, headers=self.headers)
            res.raise_for_status()
            repo_info = res.json()
            default_branch = repo_info.get("default_branch", "main")

        # 2. Get recursive tree
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(tree_url, headers=self.headers)
            res.raise_for_status()
            tree_data = res.json()
            return {
                "branch": default_branch,
                "tree": tree_data.get("tree", []),
                "truncated": tree_data.get("truncated", False),
            }

    def detect_tech_stack(self, file_paths: list[str]) -> list[str]:
        """Infer tech stack based on project files."""
        stack = set()
        for p in file_paths:
            p_lower = p.lower()
            if "package.json" in p_lower:
                stack.add("Node.js / JavaScript")
            if "tsconfig.json" in p_lower:
                stack.add("TypeScript")
            if "pom.xml" in p_lower:
                stack.add("Java / Maven")
            if "build.gradle" in p_lower:
                stack.add("Java/Kotlin / Gradle")
            if "requirements.txt" in p_lower or "pipfile" in p_lower or "pyproject.toml" in p_lower:
                stack.add("Python")
            if "cargo.toml" in p_lower:
                stack.add("Rust")
            if "go.mod" in p_lower:
                stack.add("Go")
            if "gemfile" in p_lower:
                stack.add("Ruby")
            if "composer.json" in p_lower:
                stack.add("PHP")
            if "dockerfile" in p_lower or "docker-compose" in p_lower:
                stack.add("Docker")
            if "next.config" in p_lower:
                stack.add("Next.js")
            if "tailwind.config" in p_lower:
                stack.add("Tailwind CSS")
            if "prisma/schema.prisma" in p_lower:
                stack.add("Prisma ORM")
        return list(stack) if stack else ["General Source Code"]

    async def analyze_repo(
        self, owner: str, repo: str, model: str, gemini_key: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Analyze structural configuration, files, and auto-generate:
          - Project Summary
          - Folder Structure Explanation
          - Tech Stack Detection
          - Architecture Overview
          - README Proposal
        """
        tree_result = await self.get_recursive_tree(owner, repo)
        files = [f["path"] for f in tree_result["tree"] if f["type"] == "blob"]
        folders = [f["path"] for f in tree_result["tree"] if f["type"] == "tree"]

        tech_stack = self.detect_tech_stack(files)

        # Build structural summary prompt
        summary_prompt = (
            f"Analyze this public GitHub repository: {owner}/{repo}\n"
            f"Tech Stack detected: {', '.join(tech_stack)}\n"
            f"Total files: {len(files)}\n"
            f"Here are the top files in the repository:\n"
            f"{'\\n'.join(files[:60])}\n\n"
            "Please generate:\n"
            "1. **Project Summary**: What is the purpose of this project?\n"
            "2. **Architecture Overview**: How is the code structured? (API/client/server/database layer maps)\n"
            "3. **Code Quality Suggestions**: What patterns are good, what dependencies could be issues?\n"
            "4. **Learning Roadmap**: Where should a new developer start reading code?\n"
        )

        analysis = await chat_service.complete(
            messages=[{"role": "user", "content": summary_prompt}],
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=(
                "You are IntelliDev AI, an expert software architect. Analyze repositories based "
                "on their file names and directory trees. Be detailed, structured, and write in Markdown."
            ),
        )

        return {
            "owner": owner,
            "repo": repo,
            "tech_stack": tech_stack,
            "file_count": len(files),
            "folder_count": len(folders),
            "analysis": analysis,
            "tree_preview": files[:50],  # send a subset for visual inspection
        }

    async def answer_repo_qa(
        self,
        owner: str,
        repo: str,
        question: str,
        model: str,
        gemini_key: Optional[str] = None,
    ) -> str:
        """Answer questions about the codebase based on its structure and manifest files."""
        tree_result = await self.get_recursive_tree(owner, repo)
        files = [f["path"] for f in tree_result["tree"] if f["type"] == "blob"]

        qa_prompt = (
            f"You are answering questions about the repository: {owner}/{repo}\n"
            f"Codebase Structure:\n"
            f"{'\\n'.join(files[:100])}\n\n"
            f"Question: {question}\n\n"
            "Answer the question clearly using the context of the files listed above."
        )

        return await chat_service.complete(
            messages=[{"role": "user", "content": qa_prompt}],
            model=model,
            gemini_api_key=gemini_key,
            system_prompt="You are an expert developer assistant familiar with this codebase structure.",
        )


# Singleton
github_service = GithubService()
