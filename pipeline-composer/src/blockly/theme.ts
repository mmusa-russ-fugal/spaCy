import * as Blockly from "blockly/core"

import type { Category } from "@/lib/catalog"

// spaCy website theme colours (website/src/styles/layout.sass)
export const categoryColours: Record<Category | "pipeline", string> = {
  pipeline: "#09a3d5", // --color-theme-blue  hsl(195 92% 44%)
  trainable: "#6642d1", // --color-theme-purple hsl(255 61% 54%)
  rulebased: "#05ad80", // --color-theme-green  hsl(164 94% 35%)
  utility: "#daa60b", // --color-yellow (dark)  hsl(45 90% 45%)
}

export const composerTheme = Blockly.Theme.defineTheme("spacy_composer", {
  name: "spacy_composer",
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

/**
 * Dark variant applied when the app is in dark mode (see BlocklyCanvas, which
 * follows the `.dark` class on <html> set by the theme toggle). Inherits the
 * block/category/font styling from `composerTheme` and only recolours the
 * workspace chrome (background, toolbox, flyout, scrollbars) so the block
 * palette stays identical in both modes.
 */
export const composerDarkTheme = Blockly.Theme.defineTheme("spacy_composer_dark", {
  name: "spacy_composer_dark",
  base: composerTheme,
  componentStyles: {
    workspaceBackgroundColour: "#18181b", // zinc-900
    toolboxBackgroundColour: "#27272a", // zinc-800
    toolboxForegroundColour: "#e4e4e7", // zinc-200
    flyoutBackgroundColour: "#27272a",
    flyoutForegroundColour: "#a1a1aa", // zinc-400
    flyoutOpacity: 1,
    scrollbarColour: "#52525b", // zinc-600
    scrollbarOpacity: 0.6,
    insertionMarkerColour: "#fafafa",
    insertionMarkerOpacity: 0.3,
    cursorColour: "#fafafa",
    selectedGlowColour: categoryColours.pipeline,
  },
})
