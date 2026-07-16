/**
 * Blockly theme for the pipeline builder, ported from
 * `pipeline-composer/src/blockly/theme.ts`. The block colours are the
 * website's own theme colours (src/styles/layout.sass), so the editor sits
 * naturally in the docs pages.
 */
import * as Blockly from 'blockly/core'

import type { Category } from './catalog'

// spaCy website theme colours (website/src/styles/layout.sass)
export const categoryColours: Record<Category | 'pipeline', string> = {
    pipeline: '#09a3d5', // --color-theme-blue  hsl(195 92% 44%)
    trainable: '#6642d1', // --color-theme-purple hsl(255 61% 54%)
    rulebased: '#05ad80', // --color-theme-green  hsl(164 94% 35%)
    utility: '#daa60b', // --color-yellow (dark)  hsl(45 90% 45%)
}

export const composerTheme = Blockly.Theme.defineTheme('spacy_composer', {
    name: 'spacy_composer',
    base: Blockly.Themes.Classic,
    blockStyles: {
        pipeline_blocks: { colourPrimary: categoryColours.pipeline },
        trainable_blocks: { colourPrimary: categoryColours.trainable },
        rulebased_blocks: { colourPrimary: categoryColours.rulebased },
        utility_blocks: { colourPrimary: categoryColours.utility },
    },
    categoryStyles: {
        pipeline_category: { colour: categoryColours.pipeline },
        trainable_category: { colour: categoryColours.trainable },
        rulebased_category: { colour: categoryColours.rulebased },
        utility_category: { colour: categoryColours.utility },
    },
    fontStyle: {
        family: "'HK Grotesk', system-ui, sans-serif",
        size: 10.5,
    },
})
