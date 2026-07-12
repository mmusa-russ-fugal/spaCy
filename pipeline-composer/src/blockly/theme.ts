import * as Blockly from "blockly/core"

import type { Category } from "@/lib/catalog"

export const categoryColours: Record<Category | "pipeline", string> = {
  pipeline: "#0ea5e9", // sky
  trainable: "#8b5cf6", // violet
  rulebased: "#10b981", // emerald
  utility: "#f59e0b", // amber
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
    family: "system-ui, sans-serif",
    size: 10.5,
  },
})
