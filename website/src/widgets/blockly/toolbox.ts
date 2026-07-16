/**
 * Toolbox definition, ported from `pipeline-composer/src/blockly/toolbox.ts`
 * and adapted to build per-preset: each preset lists the categories it
 * exposes (see presets.ts); an empty list means no toolbox at all (tour and
 * snippet modes).
 */
import { catalog } from './catalog'
import type { ToolboxCategory } from './presets'
import { COMPONENT_BLOCK_PREFIX, PIPELINE_BLOCK_TYPE } from './spec'

interface ToolboxItemJson {
    kind: string
    type?: string
    name?: string
    categorystyle?: string
    contents?: ToolboxItemJson[]
}

function categoryContents(category: string): ToolboxItemJson[] {
    return catalog
        .filter((c) => c.category === category)
        .map((c) => ({ kind: 'block', type: `${COMPONENT_BLOCK_PREFIX}${c.factory}` }))
}

const CATEGORIES: Record<ToolboxCategory, ToolboxItemJson> = {
    pipeline: {
        kind: 'category',
        name: 'Pipeline',
        categorystyle: 'pipeline_category',
        contents: [{ kind: 'block', type: PIPELINE_BLOCK_TYPE }],
    },
    trainable: {
        kind: 'category',
        name: 'Trainable',
        categorystyle: 'trainable_category',
        contents: categoryContents('trainable'),
    },
    rulebased: {
        kind: 'category',
        name: 'Rule-based',
        categorystyle: 'rulebased_category',
        contents: categoryContents('rulebased'),
    },
    utility: {
        kind: 'category',
        name: 'Utilities',
        categorystyle: 'utility_category',
        contents: categoryContents('utility'),
    },
}

/** Toolbox JSON for the preset's categories, or undefined for no toolbox. */
export function buildToolbox(
    categories: ToolboxCategory[]
): { kind: 'categoryToolbox'; contents: ToolboxItemJson[] } | undefined {
    if (!categories.length) return undefined
    return {
        kind: 'categoryToolbox',
        contents: categories.map((c) => CATEGORIES[c]),
    }
}
