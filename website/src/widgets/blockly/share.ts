/**
 * "Open in Composer" hand-off: serialize the builder's neutral BuilderState
 * into the standalone pipeline-composer's Blockly-workspace format and encode
 * it into a URL fragment the composer reads on load (see the composer's
 * src/lib/share.ts). The fragment (not a query) keeps the payload off the
 * server — the static host never sees it.
 *
 * Every mode maps to the same composer shape: one `spacy_pipeline` block
 * (LANG / BASE / MODEL) holding a stack of `spacy_c_<factory>` component blocks
 * whose fields carry name, source, disabled, config overrides (F_<KEY>) and
 * ruler patterns (F_PATTERNS as JSONL). Snippet mode's single add_pipe call is
 * emitted as a one-component pipeline; the composer has no `spacy_add_pipe`
 * block, so it is never emitted here.
 */
import { COMPONENT_BLOCK_PREFIX, PIPELINE_BLOCK_TYPE, fieldName } from './spec'
import type { BuilderState, PipelineComponentState } from './spec'

/** The composer reads this fragment key; keep in sync with its src/lib/share.ts. */
export const SHARE_PARAM = 'pipeline'

interface ComposerBlock {
    type: string
    x?: number
    y?: number
    fields?: Record<string, unknown>
    inputs?: Record<string, { block?: ComposerBlock }>
    next?: { block?: ComposerBlock }
}

function componentBlock(
    comp: PipelineComponentState,
    next: ComposerBlock | undefined
): ComposerBlock {
    const fields: Record<string, unknown> = {
        NAME: comp.name && comp.name !== comp.factory ? comp.name : '',
        SOURCE: comp.source ?? '',
        DISABLED: comp.disabled,
    }
    // Config overrides ride along as F_<KEY> fields — the same names the
    // composer's block definitions and spec parser use (fieldName()).
    for (const [key, value] of Object.entries(comp.config ?? {})) {
        fields[fieldName(key)] = value
    }
    // entity_ruler / span_ruler patterns serialize back to JSONL text.
    if (comp.patterns?.length) {
        fields[fieldName('patterns')] = comp.patterns.map((p) => JSON.stringify(p)).join('\n')
    }
    return {
        type: `${COMPONENT_BLOCK_PREFIX}${comp.factory}`,
        fields,
        ...(next ? { next: { block: next } } : {}),
    }
}

/** BuilderState -> pipeline-composer workspace JSON (Blockly save() shape). */
export function toComposerWorkspace(state: BuilderState): unknown {
    // Tour mode seeds the base model's own components as blocks; those already
    // live inside a loaded model, so don't re-add them as explicit components
    // in the composer (which would duplicate them).
    const components = state.pipeline.filter((c) => !(c.fromBase && state.base))
    let chain: ComposerBlock | undefined
    for (let i = components.length - 1; i >= 0; i--) {
        chain = componentBlock(components[i], chain)
    }
    const root: ComposerBlock = {
        type: PIPELINE_BLOCK_TYPE,
        x: 24,
        y: 24,
        fields: {
            LANG: state.lang,
            BASE: state.base ? 'model' : 'blank',
            MODEL: state.base ?? 'en_core_web_sm',
        },
        ...(chain ? { inputs: { COMPONENTS: { block: chain } } } : {}),
    }
    return { blocks: { languageVersion: 0, blocks: [root] } }
}

function toBase64Url(text: string): string {
    const bytes = new TextEncoder().encode(text)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Absolute href to the composer, seeded with the current pipeline in the URL
 * fragment. Resolved against the current origin: the composer is co-deployed at
 * `/composer` alongside these docs. Returns null off the browser (SSR).
 */
export function composerHref(state: BuilderState): string | null {
    if (typeof window === 'undefined') return null
    const encoded = toBase64Url(JSON.stringify(toComposerWorkspace(state)))
    const url = new URL('/composer/', window.location.origin)
    url.hash = `${SHARE_PARAM}=${encoded}`
    return url.toString()
}
