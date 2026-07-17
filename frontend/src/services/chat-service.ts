/**
 * Chat API service – frontend side.
 * Encapsulates all calls to the FastAPI /api/chat endpoints.
 */

import { API_BASE } from "@/lib/api-client"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface LLMModel {
  id: string
  name: string
  provider: "ollama" | "gemini"
}

/**
 * Fetch the list of available models from the backend.
 */
export async function fetchModels(): Promise<LLMModel[]> {
  const res = await fetch(`${API_BASE}/api/chat/models`)
  if (!res.ok) throw new Error("Failed to fetch models")
  const data = await res.json()
  return data.models
}

export interface TestKeyResult {
  status: "success" | "invalid_key" | "forbidden" | "model_unavailable" | "rate_limited" | "error"
  message: string
  model?: string
  preview?: string
}

export async function testGeminiKey(apiKey: string, model: string): Promise<TestKeyResult> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/test-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gemini-Api-Key": apiKey,
      },
      body: JSON.stringify({ model }),
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return await res.json()
  } catch (err: any) {
    return { status: "error", message: err.message || "Network error — is the backend running?" }
  }
}


/**
 * Stream a chat completion from the backend using SSE.
 *
 * @param messages  Full conversation history
 * @param model     Model ID string (e.g. "ollama:llama3")
 * @param geminiKey Optional Gemini API key from user settings
 * @param onChunk   Callback invoked with each text chunk as it arrives
 * @param onDone    Callback invoked when the stream completes
 * @param onError   Callback invoked if an error occurs
 */
export async function streamChat(params: {
  messages: ChatMessage[]
  model: string
  geminiKey?: string
  groqKey?: string
  systemPrompt?: string
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}) {
  const { messages, model, geminiKey, groqKey, systemPrompt, onChunk, onDone, onError } = params

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (geminiKey) {
    headers["X-Gemini-Api-Key"] = geminiKey
  }
  if (groqKey) {
    headers["X-Groq-Api-Key"] = groqKey
  }

  try {
    const res = await fetch(`${API_BASE}/api/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        model,
        system_prompt: systemPrompt,
      }),
    })

    if (!res.ok || !res.body) {
      onError("Failed to connect to AI provider")
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") {
            onDone()
            return
          }
          if (data.startsWith("[ERROR]")) {
            onError(data.replace("[ERROR] ", ""))
            return
          }
          // Unescape newlines that were escaped by the server
          onChunk(data.replace(/\\n/g, "\n"))
        }
      }
    }

    onDone()
  } catch (err: any) {
    onError(err.message || "Connection failed")
  }
}
