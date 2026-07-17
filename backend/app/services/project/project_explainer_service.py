"""
AI Project Explainer service.
Accepts ZIP folder uploads or GitHub repository structures and auto-generates:
  - Architecture Flowcharts (Mermaid.js)
  - Interactive Folder explanations
  - Database Schema explanations (Mermaid ER diagrams)
  - API Flows & Route summaries
  - Auto-generated READMEs
  - Code Smell detection and step-by-step developer learning roadmaps.
"""

import zipfile
import io
from typing import Any, Optional
from app.services.chat.chat_service import chat_service
from app.services.github.github_service import github_service


class ProjectExplainerService:
    """Flagship engine analyzing project packages and rendering visual blueprints."""

    def _extract_zip_structure(self, zip_bytes: bytes) -> list[str]:
        """Read files inside a ZIP archive without writing them to disk."""
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            return [name for name in z.namelist() if not name.endswith("/")]

    async def analyze_project_zip(
        self, zip_bytes: bytes, filename: str, model: str, gemini_key: Optional[str] = None
    ) -> dict[str, Any]:
        """Extract files from a ZIP upload and perform full workspace explanations."""
        files = self._extract_zip_structure(zip_bytes)
        return await self._generate_explanations(
            project_name=filename.rsplit(".", 1)[0],
            files=files,
            model=model,
            gemini_key=gemini_key,
        )

    async def analyze_project_github(
        self, url: str, model: str, gemini_key: Optional[str] = None
    ) -> dict[str, Any]:
        """Use GitHub API tree scan to feed into the Explainer engine."""
        from app.routers.github import parse_github_url

        owner, repo = parse_github_url(url)
        tree_result = await github_service.get_recursive_tree(owner, repo)
        files = [f["path"] for f in tree_result["tree"] if f["type"] == "blob"]
        return await self._generate_explanations(
            project_name=repo,
            files=files,
            model=model,
            gemini_key=gemini_key,
        )

    async def _generate_explanations(
        self, project_name: str, files: list[str], model: str, gemini_key: Optional[str] = None
    ) -> dict[str, Any]:
        """Common orchestrator for ZIP and GitHub inputs generating structural overviews."""
        file_tree = "\\n".join(files[:80])

        system_prompt = (
            "You are IntelliDev AI, a principal software architect. You analyze project files "
            "and create clean, professional visual maps using Mermaid.js and Markdown."
        )

        # 1. Mermaid.js Flowchart (Architecture)
        arch_prompt = (
            f"Generate a Mermaid.js diagram representing the system architecture of the project '{project_name}' "
            f"based on these files:\n{file_tree}\n\n"
            "Rules:\n"
            "- Return ONLY a valid Mermaid.js flowchart (graph TD).\n"
            "- Wrap the output in a markdown block: ```mermaid ... ```.\n"
            "- Map visual modules e.g., client, routes, database tables, middleware."
        )
        architecture_diagram = await chat_service.complete(
            messages=[{"role": "user", "content": arch_prompt}],
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=system_prompt,
        )

        # 2. Tech Stack & Dependencies explanation
        docs_prompt = (
            f"Write detailed developer documentation for '{project_name}' from these files:\n{file_tree}\n\n"
            "Include:\n"
            "- Folder Structure Explanation\n"
            "- Tech Stack Details\n"
            "- API Flow & Route explanations (where requests enter, validation, controller execution)\n"
            "- Database Explanation (if Prisma, SQL, or local DB patterns are visible)\n"
            "- Code Smell / Improvement Suggestions\n"
            "- Developer Learning Roadmap (step-by-step reading list for a new engineer)"
        )
        dev_documentation = await chat_service.complete(
            messages=[{"role": "user", "content": docs_prompt}],
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=system_prompt,
        )

        # 3. Standardized README Proposal
        readme_prompt = (
            f"Generate a highly professional README.md for '{project_name}' based on these files:\n{file_tree}\n\n"
            "Include Title, Tagline, Features, Project Structure, Getting Started instructions, and Contribution guidelines."
        )
        proposed_readme = await chat_service.complete(
            messages=[{"role": "user", "content": readme_prompt}],
            model=model,
            gemini_api_key=gemini_key,
            system_prompt=system_prompt,
        )

        return {
            "project_name": project_name,
            "file_count": len(files),
            "architecture_diagram": architecture_diagram,
            "dev_documentation": dev_documentation,
            "proposed_readme": proposed_readme,
            "files_preview": files[:50],
        }


# Singleton
project_explainer_service = ProjectExplainerService()
