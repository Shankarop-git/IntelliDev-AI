/**
 * GitHub Analyzer frontend service.
 * Connects directly to FastAPI /api/github/* endpoints.
 */

import { API_BASE } from "@/lib/api-client"

export interface RepoAnalysisResult {
  owner: string
  repo: string
  tech_stack: string[]
  file_count: number
  folder_count: number
  analysis: string
  tree_preview: string[]
}

export interface RepoQAAnswer {
  answer: string
}

function buildHeaders(geminiKey?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (geminiKey) h["X-Gemini-Api-Key"] = geminiKey
  return h
}

/**
 * Scan and analyze a public repository.
 */
export async function analyzeRepository(
  url: string,
  model: string,
  geminiKey?: string,
): Promise<RepoAnalysisResult> {
  const res = await fetch(`${API_BASE}/api/github/analyze`, {
    method: "POST",
    headers: buildHeaders(geminiKey),
    body: JSON.stringify({ url, model }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "Scanning failed")
  }
  return res.json()
}

/**
 * Ask a question about the scanned repository structure.
 */
export async function askRepositoryQA(
  url: string,
  question: string,
  model: string,
  geminiKey?: string,
): Promise<RepoQAAnswer> {
  const res = await fetch(`${API_BASE}/api/github/qa`, {
    method: "POST",
    headers: buildHeaders(geminiKey),
    body: JSON.stringify({ url, question, model }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "Q&A failed")
  }
  return res.json()
}
