import { catalogByFactory, factoryMeta } from "@/lib/catalog"

/** Neutral description of a composed pipeline; everything renders from this. */
export interface ComponentSpec {
  factory: string
  /** Pipe name; defaults to the factory name, uniquified for duplicates. */
  name: string
  /** True when the user typed a custom name (affects generated code). */
  explicitName: boolean
  /** Non-default config overrides only. */
  config: Record<string, unknown>
  /** entity_ruler / span_ruler patterns (parsed from JSONL). */
  patterns?: unknown[]
  /** Blockly block id, for attaching warnings back onto blocks. */
  blockId?: string
}

export interface PipelineSpec {
  lang: string
  base: { type: "blank" } | { type: "model"; name: string }
  components: ComponentSpec[]
}

export interface SpecIssue {
  blockId?: string
  message: string
}

export interface SpecResult {
  spec: PipelineSpec | null
  issues: SpecIssue[]
}

/* Minimal shape of Blockly.serialization.workspaces.save() output. */
interface SerializedBlock {
  type: string
  id?: string
  fields?: Record<string, unknown>
  inputs?: Record<string, { block?: SerializedBlock }>
  next?: { block?: SerializedBlock }
}

interface SerializedWorkspace {
  blocks?: { blocks?: SerializedBlock[] }
}

export const PIPELINE_BLOCK_TYPE = "spacy_pipeline"
export const COMPONENT_BLOCK_PREFIX = "spacy_c_"

export function fieldName(key: string): string {
  return `F_${key.toUpperCase()}`
}

function asBool(raw: unknown): boolean {
  return raw === true || raw === "TRUE" || raw === "true"
}

function walkStack(first: SerializedBlock | undefined): SerializedBlock[] {
  const out: SerializedBlock[] = []
  let cur = first
  while (cur) {
    out.push(cur)
    cur = cur.next?.block
  }
  return out
}

function parsePatterns(
  raw: string,
  blockId: string | undefined,
  issues: SpecIssue[]
): unknown[] | undefined {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return undefined
  const patterns: unknown[] = []
  for (const line of lines) {
    try {
      patterns.push(JSON.parse(line))
    } catch {
      issues.push({
        blockId,
        message: `Invalid JSON pattern line: ${line.slice(0, 60)}`,
      })
    }
  }
  return patterns.length ? patterns : undefined
}

function componentFromBlock(
  block: SerializedBlock,
  issues: SpecIssue[]
): ComponentSpec | null {
  const factory = block.type.slice(COMPONENT_BLOCK_PREFIX.length)
  const def = catalogByFactory[factory]
  if (!def) {
    issues.push({ blockId: block.id, message: `Unknown component block: ${block.type}` })
    return null
  }
  const meta = factoryMeta[factory]
  const fields = block.fields ?? {}
  const rawName = typeof fields.NAME === "string" ? fields.NAME.trim() : ""
  const config: Record<string, unknown> = {}
  let patterns: unknown[] | undefined

  for (const fieldDef of def.fields) {
    const raw = fields[fieldName(fieldDef.key)]
    if (raw === undefined || raw === null) continue
    if (fieldDef.isPatterns) {
      if (typeof raw === "string") {
        patterns = parsePatterns(raw, block.id, issues)
      }
      continue
    }
    let value: unknown
    switch (fieldDef.widget) {
      case "checkbox":
        value = asBool(raw)
        break
      case "number": {
        const num = typeof raw === "number" ? raw : Number(raw)
        if (Number.isNaN(num)) continue
        value = num
        break
      }
      case "dropdown": {
        if (raw === "__default__") continue
        value = raw
        break
      }
      default: {
        const text = String(raw).trim()
        if (!text) continue
        value = fieldDef.toConfig ? fieldDef.toConfig(text) : text
        if (value === undefined) continue
      }
    }
    const defaultValue = meta?.defaultConfig?.[fieldDef.key]
    if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
      config[fieldDef.key] = value
    }
  }

  return {
    factory,
    name: rawName || factory,
    explicitName: Boolean(rawName),
    config,
    patterns,
    blockId: block.id,
  }
}

function uniquifyNames(components: ComponentSpec[], issues: SpecIssue[]): void {
  const seen = new Map<string, number>()
  for (const comp of components) {
    const count = seen.get(comp.name) ?? 0
    seen.set(comp.name, count + 1)
    if (count > 0) {
      if (comp.explicitName) {
        issues.push({
          blockId: comp.blockId,
          message: `Duplicate component name "${comp.name}" — names must be unique.`,
        })
      }
      comp.name = `${comp.name}_${count + 1}`
    }
  }
}

/**
 * Convert a serialized Blockly workspace into a PipelineSpec.
 * Returns spec: null when no pipeline root block exists on the canvas.
 */
export function specFromWorkspace(state: unknown): SpecResult {
  const issues: SpecIssue[] = []
  const topBlocks = (state as SerializedWorkspace)?.blocks?.blocks ?? []
  const roots = topBlocks.filter((b) => b.type === PIPELINE_BLOCK_TYPE)
  if (!roots.length) {
    return { spec: null, issues }
  }
  if (roots.length > 1) {
    issues.push({ message: "Multiple pipeline blocks found; using the first one." })
  }
  const root = roots[0]
  const fields = root.fields ?? {}
  const lang = typeof fields.LANG === "string" ? fields.LANG : "en"
  const baseKind = fields.BASE === "model" ? "model" : "blank"
  const modelName =
    typeof fields.MODEL === "string" && fields.MODEL.trim()
      ? fields.MODEL.trim()
      : "en_core_web_sm"

  const components: ComponentSpec[] = []
  for (const block of walkStack(root.inputs?.COMPONENTS?.block)) {
    if (!block.type.startsWith(COMPONENT_BLOCK_PREFIX)) {
      issues.push({ blockId: block.id, message: `Unexpected block in pipeline: ${block.type}` })
      continue
    }
    const comp = componentFromBlock(block, issues)
    if (comp) components.push(comp)
  }
  uniquifyNames(components, issues)

  const orphaned = topBlocks.filter(
    (b) => b.type.startsWith(COMPONENT_BLOCK_PREFIX)
  )
  for (const block of orphaned) {
    issues.push({
      blockId: block.id,
      message: "Component block is not attached to the pipeline and will be ignored.",
    })
  }

  return {
    spec: {
      lang,
      base: baseKind === "model" ? { type: "model", name: modelName } : { type: "blank" },
      components,
    },
    issues,
  }
}
