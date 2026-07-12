import { PlayIcon, Loader2Icon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { BackendStatus } from "@/components/BackendStatus"
import { ResultsView } from "@/components/ResultsView"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { languages } from "@/lib/catalog"
import type { PipelineSpec } from "@/lib/spec"
import { detectBackend, runOnBackend } from "@/runtime/backend"
import { getPyodideEngine, getPyodideSpacyVersion, runOnPyodide } from "@/runtime/pyodide"
import type { EngineState, RunResult } from "@/runtime/types"

const DEFAULT_TEXT = "Apple is looking at buying U.K. startup for $1 billion."

export function RunTab({ spec }: { spec: PipelineSpec | null }) {
  const [engine, setEngine] = useState<EngineState>({ kind: "unknown" })
  const [text, setText] = useState(DEFAULT_TEXT)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pyodideWanted = useRef(false)

  const checkBackend = useCallback(async () => {
    setEngine({ kind: "checking" })
    const health = await detectBackend()
    if (health) {
      setEngine({
        kind: "local",
        spacyVersion: health.spacy_version,
        models: health.models,
      })
    } else if (pyodideWanted.current) {
      setEngine({ kind: "pyodide-loading", stage: "Reconnecting…" })
      try {
        const version = await getPyodideSpacyVersion((stage) =>
          setEngine({ kind: "pyodide-loading", stage })
        )
        setEngine({ kind: "pyodide", spacyVersion: version })
      } catch (err) {
        setEngine({ kind: "error", message: String(err) })
      }
    } else {
      setEngine({ kind: "no-backend" })
    }
  }, [])

  useEffect(() => {
    void checkBackend()
  }, [checkBackend])

  const enablePyodide = useCallback(async () => {
    pyodideWanted.current = true
    setEngine({ kind: "pyodide-loading", stage: "Starting…" })
    try {
      await getPyodideEngine((stage) => setEngine({ kind: "pyodide-loading", stage }))
      const version = await getPyodideSpacyVersion(() => {})
      setEngine({ kind: "pyodide", spacyVersion: version })
    } catch (err) {
      setEngine({
        kind: "error",
        message: `In-browser engine failed to load: ${String(err)}`,
      })
    }
  }, [])

  const canRun =
    !!spec && !running && (engine.kind === "local" || engine.kind === "pyodide")

  const pyodideBlockers: string[] = []
  if (spec && engine.kind === "pyodide") {
    if (spec.base.type === "model") {
      pyodideBlockers.push(
        "Trained model bases need the local run server — the in-browser engine only supports blank pipelines."
      )
    }
    const lang = languages.find((l) => l.code === spec.lang)
    if (lang && !lang.pyodideOk) {
      pyodideBlockers.push(
        `Language "${lang.label}" needs tokenizer dependencies that are unavailable in the browser.`
      )
    }
  }

  const run = async () => {
    if (!spec) return
    setRunning(true)
    setError(null)
    try {
      const request = { spec, text }
      const res =
        engine.kind === "local"
          ? await runOnBackend(request)
          : await runOnPyodide(request, () => {})
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <BackendStatus
        engine={engine}
        onRecheck={() => void checkBackend()}
        onEnablePyodide={() => void enablePyodide()}
      />

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Sample text to run through the pipeline…"
        className="min-h-20 shrink-0 font-mono text-xs"
        maxLength={10_000}
      />

      <div className="flex shrink-0 items-center gap-2">
        <Button onClick={() => void run()} disabled={!canRun || pyodideBlockers.length > 0}>
          {running ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
          Run pipeline
        </Button>
        {!spec && (
          <span className="text-xs text-muted-foreground">
            Add a pipeline block to the canvas first.
          </span>
        )}
      </div>

      {pyodideBlockers.map((msg, i) => (
        <div
          key={i}
          className="shrink-0 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
          {msg}
        </div>
      ))}

      {error && (
        <div className="shrink-0 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        {result ? (
          <ResultsView result={result} />
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Run the pipeline to see tokens, entities, and visualizations here.
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
