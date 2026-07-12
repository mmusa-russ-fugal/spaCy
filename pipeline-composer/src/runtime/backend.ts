import type { RunRequest, RunResult } from "@/runtime/types"

export const DEFAULT_BACKEND = "http://127.0.0.1:8765"

export interface BackendHealth {
  status: string
  spacy_version: string
  models: string[]
}

/** Probe the optional local run server; resolves null when unreachable. */
export async function detectBackend(
  baseUrl: string = DEFAULT_BACKEND
): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return null
    const data = (await res.json()) as BackendHealth
    return data.status === "ok" ? data : null
  } catch {
    return null
  }
}

export async function runOnBackend(
  request: RunRequest,
  baseUrl: string = DEFAULT_BACKEND
): Promise<RunResult> {
  const res = await fetch(`${baseUrl}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60_000),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error ?? `Run failed with HTTP ${res.status}`)
  }
  return data as RunResult
}
