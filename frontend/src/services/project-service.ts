/**
 * Project Explainer frontend service.
 * Wraps ZIP uploads and GitHub URLs scanners.
 */

import { API_BASE } from "@/lib/api-client"

export interface ExplainerResult {
  project_name: string
  file_count: number
  architecture_diagram: string
  dev_documentation: string
  proposed_readme: string
  files_preview: string[]
}

function buildHeaders(geminiKey?: string): Record<string, string> {
  const h: Record<string, string> = {}
  if (geminiKey) h["X-Gemini-Api-Key"] = geminiKey
  return h
}

/**
 * Scan project using a public GitHub repository.
 */
export async function explainGitHubProject(
  url: string,
  model: string,
  geminiKey?: string,
): Promise<ExplainerResult> {
  const res = await fetch(`${API_BASE}/api/project/github`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(geminiKey),
    },
    body: JSON.stringify({ url, model }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "Scans failed")
  }
  return res.json()
}

/**
 * Upload a local project folder compressed in ZIP format.
 */
export async function explainZIPProject(
  file: File,
  model: string,
  geminiKey?: string,
): Promise<ExplainerResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("model", model)

  const res = await fetch(`${API_BASE}/api/project/zip`, {
    method: "POST",
    headers: buildHeaders(geminiKey),
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "ZIP upload analysis failed")
  }
  return res.json()
}
