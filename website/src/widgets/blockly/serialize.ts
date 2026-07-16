/**
 * Builder state -> serialized Blockly workspace JSON, the inverse of
 * spec.ts's traversal. Used to seed the canvas from a preset's initial
 * state and to restore it on reset (the composer keeps hand-written
 * serialized workspaces in `pipeline-composer/src/lib/presets.ts`; the
 * docs widget derives them from the seam state instead so presets stay in
 * the placeholder's documented shape).
 *
 * Only fields that exist on the mode's block definitions are emitted
 * (Blockly logs console warnings for unknown fields): config-override
 * fields are never seeded — presets only carry name/source/disabled.
 */
import type { BuilderPreset } from './presets'
import type { BuilderState, PipelineComponentState } from './spec'
import { ADD_PIPE_BLOCK_TYPE, COMPONENT_BLOCK_PREFIX, PIPELINE_BLOCK_TYPE } from './spec'

interface SerializedBlockJson {
    type: string
    x?: number
    y?: number
    movable?: boolean
    deletable?: boolean
    editable?: boolean
    fields?: Record<string, unknown>
    inputs?: Record<string, { block?: SerializedBlockJson }>
    next?: { block?: SerializedBlockJson }
}

function componentBlockJson(
    comp: PipelineComponentState,
    preset: BuilderPreset,
    next: SerializedBlockJson | undefined
): SerializedBlockJson {
    const locked = preset.mode === 'tour'
    const fields: Record<string, unknown> = { DISABLED: comp.disabled }
    if (!locked) {
        fields.NAME = comp.name === comp.factory ? '' : comp.name
        fields.SOURCE = comp.source ?? ''
    }
    return {
        type: `${COMPONENT_BLOCK_PREFIX}${comp.factory}`,
        ...(locked ? { movable: false, deletable: false } : {}),
        fields,
        ...(next ? { next: { block: next } } : {}),
    }
}

/** Serialize the seam state into loadable Blockly workspace JSON. */
export function workspaceJsonFromState(state: BuilderState, preset: BuilderPreset): unknown {
    if (preset.mode === 'snippet') {
        const comp = state.pipeline[0]
        return {
            blocks: {
                languageVersion: 0,
                blocks: [
                    {
                        type: ADD_PIPE_BLOCK_TYPE,
                        x: 24,
                        y: 24,
                        deletable: false,
                        fields: {
                            FACTORY: comp?.factory ?? 'entity_ruler',
                            PLACEMENT: state.placement.arg,
                            TARGET: state.placement.target,
                            SOURCE: Boolean(comp?.source),
                        },
                    },
                ],
            },
        }
    }

    let chain: SerializedBlockJson | undefined
    for (let i = state.pipeline.length - 1; i >= 0; i--) {
        chain = componentBlockJson(state.pipeline[i], preset, chain)
    }

    const locked = preset.mode === 'tour'
    const fields: Record<string, unknown> = { LANG: state.lang }
    if (preset.mode !== 'config') {
        fields.BASE = state.base ? 'model' : 'blank'
        fields.MODEL = state.base ?? 'en_core_web_sm'
    }
    const root: SerializedBlockJson = {
        type: PIPELINE_BLOCK_TYPE,
        x: 24,
        y: 24,
        ...(locked ? { movable: false, deletable: false, editable: false } : { deletable: false }),
        fields,
        ...(chain ? { inputs: { COMPONENTS: { block: chain } } } : {}),
    }
    return { blocks: { languageVersion: 0, blocks: [root] } }
}
