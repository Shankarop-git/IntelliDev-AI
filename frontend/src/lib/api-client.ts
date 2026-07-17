/**
 * API client for the FastAPI backend.
 * All calls go through this module so the base URL and auth headers
 * are managed in one place.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Generic fetch wrapper with JSON handling.
 */
async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "API request failed")
  }

  return res.json()
}

export { apiFetch, API_BASE }
