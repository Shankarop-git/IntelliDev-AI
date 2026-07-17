/**
 * Code Studio frontend service.
 * Wraps all FastAPI /api/code/* endpoints.
 */

import { API_BASE } from "@/lib/api-client"

export type CodeOperation =
  | "generate"
  | "explain"
  | "debug"
  | "review"
  | "refactor"
  | "optimize"
  | "translate"
  | "generate_api"
  | "generate_sql"
  | "explain_error"

export interface CodeResult {
  result: string
  operation: string
  language?: string
  source_language?: string
  target_language?: string
}

function buildHeaders(geminiKey?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (geminiKey) h["X-Gemini-Api-Key"] = geminiKey
  return h
}

async function post<T>(path: string, body: unknown, geminiKey?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: buildHeaders(geminiKey),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || "API error")
  }
  return res.json()
}

// ─── Exported API functions ──────────────────────────────────────────────────

export const generateCode = (prompt: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/generate", { prompt, language, model }, geminiKey)

export const explainCode = (code: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/explain", { code, language, model }, geminiKey)

export const debugCode = (code: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/debug", { code, language, model }, geminiKey)

export const reviewCode = (code: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/review", { code, language, model }, geminiKey)

export const refactorCode = (code: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/refactor", { code, language, model }, geminiKey)

export const optimizeCode = (code: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/optimize", { code, language, model }, geminiKey)

export const translateCode = (
  code: string,
  sourceLanguage: string,
  targetLanguage: string,
  model: string,
  geminiKey?: string,
) =>
  post<CodeResult>(
    "/api/code/translate",
    { code, source_language: sourceLanguage, target_language: targetLanguage, model },
    geminiKey,
  )

export const generateAPI = (spec: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/generate-api", { spec, language, model }, geminiKey)

export const generateSQL = (requirement: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/generate-sql", { requirement, model }, geminiKey)

export const explainError = (error: string, language: string, model: string, geminiKey?: string) =>
  post<CodeResult>("/api/code/explain-error", { error, language, model }, geminiKey)

export interface ExecuteResult {
  stdout: string
  stderr: string
  exit_code: number
  execution_time: number
  language: string
}

export async function executeCode(code: string, language: string, stdin: string = ""): Promise<ExecuteResult> {
  const res = await fetch(`${API_BASE}/api/code/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, stdin }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || "Execution failed")
  }
  return res.json()
}



