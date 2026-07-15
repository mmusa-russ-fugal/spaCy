import type { PipelineSpec } from "@/lib/spec"

export interface RunRequest {
  spec: PipelineSpec
  text: string
}

export interface TokenRow {
  text: string
  lemma: string
  pos: string
  tag: string
  dep: string
  head: number
  ent_type: string
  ent_iob: string
  is_sent_start: boolean
  morph: string
}

export interface EntRow {
  start: number
  end: number
  label: string
  text: string
}

export interface RunResult {
  tokens: TokenRow[]
  ents: EntRow[]
  sents: string[]
  cats: Record<string, number>
  spans: Record<string, { start: number; end: number; label: string; text: string }[]>
  displacy: { dep?: string; ent?: string }
  warnings: string[]
  meta: {
    engine: "local" | "pyodide"
    spacy_version: string
    pipeline: string[]
  }
}

export type EngineState =
  | { kind: "unknown" }
  | { kind: "checking" }
  | { kind: "local"; spacyVersion: string; models: string[] }
  | { kind: "no-backend" }
  | { kind: "pyodide-loading"; stage: string }
  | { kind: "pyodide"; spacyVersion: string }
  | { kind: "error"; message: string }
