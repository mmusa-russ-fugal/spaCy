import { Loader2Icon, RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EngineState } from "@/runtime/types"

export interface BackendStatusProps {
  engine: EngineState
  onRecheck: () => void
  onEnablePyodide: () => void
}

export function BackendStatus({ engine, onRecheck, onEnablePyodide }: BackendStatusProps) {
  switch (engine.kind) {
    case "unknown":
    case "checking":
      return (
        <Badge variant="secondary">
          <Loader2Icon className="animate-spin" /> Detecting engine…
        </Badge>
      )
    case "local":
      return (
        <Badge variant="success">
          Local server · spaCy {engine.spacyVersion}
        </Badge>
      )
    case "pyodide":
      return (
        <Badge variant="success">In-browser · spaCy {engine.spacyVersion}</Badge>
      )
    case "pyodide-loading":
      return (
        <Badge variant="secondary">
          <Loader2Icon className="animate-spin" /> {engine.stage}
        </Badge>
      )
    case "error":
      return (
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive">Engine error</Badge>
          <span className="text-xs text-muted-foreground">{engine.message}</span>
          <Button variant="outline" size="sm" onClick={onRecheck}>
            <RefreshCwIcon /> Retry
          </Button>
        </span>
      )
    default:
      return (
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="warning">No local server</Badge>
          <Button variant="outline" size="sm" onClick={onRecheck}>
            <RefreshCwIcon /> Re-check
          </Button>
          <Button variant="default" size="sm" onClick={onEnablePyodide}>
            Enable in-browser engine (~50 MB)
          </Button>
        </span>
      )
  }
}
