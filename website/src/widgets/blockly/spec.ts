/**
 * The builder's shared state shape and the serialized-Blockly-workspace ->
 * state traversal, ported from `pipeline-composer/src/lib/spec.ts` and
 * adapted to the docs widget's `({ state, setState, preset })` seam:
 *
 *  - The neutral state is the placeholder widget's documented BuilderState
 *    (lang/base/pipeline/placement — see the seam contract in workspace.tsx)
 *    instead of the composer's PipelineSpec; `source`, `disabled`, `fromBase`
 *    and `placement` carry the docs-specific semantics. The composer's
 *    per-component `config` overrides, ruler `patterns` and `blockId` ride
 *    along as optional extensions.
 *  - Snippet mode ('/api/language#add_pipe') reads a single `spacy_add_pipe`
 *    block instead of the pipeline container.
 *  - Config mode's pipeline block has no base/model fields (a config.cfg
 *    excerpt always describes a pipeline built from scratch).
 */
import { catalogByFactory, factoryMeta } from './catalog'
import type { BuilderPreset } from './presets'

/** One component in the builder state (the seam's pipeline entry). */
export interface PipelineComponentState {
    /** Component name in the pipeline (defaults to the factory name). */
    name: string
    /** Whether the block's name field was explicitly filled in (composer's
     * explicitName): explicit duplicates warn before being uniquified. */
    explicitName?: boolean
    /** Registered factory name. */
    factory: string
    /** Sourced from this trained pipeline instead of the factory, if set. */
    source: string | null
    /** build/tour: nlp.disable_pipe() / config: [training] frozen_components. */
    disabled: boolean
    /** Already part of the loaded base pipeline (tour mode): no add_pipe call. */
    fromBase: boolean
    /** Non-default config overrides collected from the block's fields. */
    config?: Record<string, unknown>
    /** entity_ruler / span_ruler patterns (parsed from JSONL). */
    patterns?: unknown[]
    /** Blockly block id, for attaching warnings back onto blocks. */
    blockId?: string
}

export type PlacementArg = 'first' | 'last' | 'before' | 'after'

/** The add_pipe placement argument (snippet mode only). */
export interface PlacementState {
    arg: PlacementArg
    target: string
}

/** The seam state: owned by builder.tsx, produced by the Blockly workspace. */
export interface BuilderState {
    /** Language code for spacy.blank(). */
    lang: string
    /** Trained pipeline for spacy.load(), or null for a blank pipeline. */
    base: string | null
    pipeline: PipelineComponentState[]
    placement: PlacementState
}

export interface SpecIssue {
    blockId?: string
    message: string
}

export interface StateResult {
    state: BuilderState
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

export interface SerializedWorkspace {
    blocks?: { blocks?: SerializedBlock[] }
}

export const PIPELINE_BLOCK_TYPE = 'spacy_pipeline'
export const COMPONENT_BLOCK_PREFIX = 'spacy_c_'
export const ADD_PIPE_BLOCK_TYPE = 'spacy_add_pipe'

/** Blockly field name for a component config key. */
export function fieldName(key: string): string {
    return `F_${key.toUpperCase()}`
}

/**
 * Component names become both Python `name=` arguments and `[components.<name>]`
 * INI section headers in config.cfg, so they must be identifier-safe. spaCy's
 * own component names follow this shape.
 */
const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

function asBool(raw: unknown): boolean {
    return raw === true || raw === 'TRUE' || raw === 'true'
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
        .split('\n')
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
): PipelineComponentState | null {
    const factory = block.type.slice(COMPONENT_BLOCK_PREFIX.length)
    const def = catalogByFactory[factory]
    if (!def) {
        issues.push({ blockId: block.id, message: `Unknown component block: ${block.type}` })
        return null
    }
    const meta = factoryMeta[factory]
    const fields = block.fields ?? {}
    const rawName = typeof fields.NAME === 'string' ? fields.NAME.trim() : ''
    const nameIsValid = !rawName || VALID_NAME.test(rawName)
    if (!nameIsValid) {
        issues.push({
            blockId: block.id,
            message: `Invalid component name "${rawName}" — use letters, digits, and underscores only (must start with a letter or underscore). Falling back to "${factory}".`,
        })
    }
    const source = typeof fields.SOURCE === 'string' && fields.SOURCE ? fields.SOURCE : null
    const disabled = asBool(fields.DISABLED)
    const config: Record<string, unknown> = {}
    let patterns: unknown[] | undefined

    for (const fieldDef of def.fields) {
        const raw = fields[fieldName(fieldDef.key)]
        if (raw === undefined || raw === null) continue
        if (fieldDef.isPatterns) {
            if (typeof raw === 'string') {
                patterns = parsePatterns(raw, block.id, issues)
            }
            continue
        }
        let value: unknown
        switch (fieldDef.widget) {
            case 'checkbox':
                value = asBool(raw)
                break
            case 'number': {
                const num = typeof raw === 'number' ? raw : Number(raw)
                if (Number.isNaN(num)) continue
                value = num
                break
            }
            case 'dropdown': {
                if (raw === '__default__') continue
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
        name: nameIsValid && rawName ? rawName : factory,
        explicitName: nameIsValid && Boolean(rawName),
        source,
        disabled,
        fromBase: false,
        config,
        patterns,
        blockId: block.id,
    }
}

function uniquifyNames(components: PipelineComponentState[], issues: SpecIssue[]): void {
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

const DEFAULT_PLACEMENT: PlacementState = { arg: 'last', target: 'ner' }

function isPlacementArg(raw: unknown): raw is PlacementArg {
    return raw === 'first' || raw === 'last' || raw === 'before' || raw === 'after'
}

/** Snippet mode: read the single spacy_add_pipe block. */
function stateFromAddPipeBlock(
    topBlocks: SerializedBlock[],
    preset: BuilderPreset,
    issues: SpecIssue[]
): BuilderState {
    const block = topBlocks.find((b) => b.type === ADD_PIPE_BLOCK_TYPE)
    const fields = block?.fields ?? {}
    const factory = typeof fields.FACTORY === 'string' ? fields.FACTORY : 'entity_ruler'
    if (!block) {
        issues.push({ message: 'No add_pipe block on the canvas.' })
    }
    return {
        lang: preset.workspace.lang,
        base: preset.workspace.base,
        pipeline: [
            {
                name: factory,
                factory,
                source: asBool(fields.SOURCE) ? (preset.workspace.base ?? 'en_core_web_sm') : null,
                disabled: false,
                fromBase: false,
                blockId: block?.id,
            },
        ],
        placement: {
            arg: isPlacementArg(fields.PLACEMENT) ? fields.PLACEMENT : 'last',
            target:
                typeof fields.TARGET === 'string' && fields.TARGET.trim()
                    ? fields.TARGET.trim()
                    : 'ner',
        },
    }
}

/**
 * Convert a serialized Blockly workspace into the builder state. Unlike the
 * composer (which returns spec: null without a pipeline root), the docs
 * widget always returns a usable state so the output pane never goes blank.
 */
export function stateFromWorkspace(serialized: unknown, preset: BuilderPreset): StateResult {
    const issues: SpecIssue[] = []
    const topBlocks = (serialized as SerializedWorkspace)?.blocks?.blocks ?? []

    if (preset.mode === 'snippet') {
        return { state: stateFromAddPipeBlock(topBlocks, preset, issues), issues }
    }

    const roots = topBlocks.filter((b) => b.type === PIPELINE_BLOCK_TYPE)
    if (roots.length > 1) {
        issues.push({ message: 'Multiple pipeline blocks found; using the first one.' })
    }
    const root: SerializedBlock | undefined = roots[0]
    if (!root) {
        issues.push({
            message: 'No pipeline block on the canvas — drag one in from the toolbox.',
        })
    }
    const fields = root?.fields ?? {}
    const lang = typeof fields.LANG === 'string' ? fields.LANG : preset.workspace.lang
    // Config mode's pipeline block has no base/model fields; a config.cfg
    // excerpt always describes a from-scratch pipeline.
    const modelName =
        typeof fields.MODEL === 'string' && fields.MODEL.trim()
            ? fields.MODEL.trim()
            : 'en_core_web_sm'
    const base = preset.mode !== 'config' && fields.BASE === 'model' ? modelName : null

    const components: PipelineComponentState[] = []
    for (const block of walkStack(root?.inputs?.COMPONENTS?.block)) {
        if (!block.type.startsWith(COMPONENT_BLOCK_PREFIX)) {
            issues.push({
                blockId: block.id,
                message: `Unexpected block in pipeline: ${block.type}`,
            })
            continue
        }
        const comp = componentFromBlock(block, issues)
        if (comp) {
            // Tour mode's canvas is seeded with (and locked to) the loaded
            // base pipeline's own components: no add_pipe calls for them.
            comp.fromBase = preset.mode === 'tour' && base !== null
            components.push(comp)
        }
    }
    uniquifyNames(components, issues)

    const orphaned = topBlocks.filter((b) => b.type.startsWith(COMPONENT_BLOCK_PREFIX))
    for (const block of orphaned) {
        issues.push({
            blockId: block.id,
            message: 'Component block is not attached to the pipeline and will be ignored.',
        })
    }

    return {
        state: { lang, base, pipeline: components, placement: DEFAULT_PLACEMENT },
        issues,
    }
}
