import { catalog } from "@/lib/catalog"
import { COMPONENT_BLOCK_PREFIX, PIPELINE_BLOCK_TYPE } from "@/lib/spec"

function categoryContents(category: string) {
  return catalog
    .filter((c) => c.category === category)
    .map((c) => ({ kind: "block", type: `${COMPONENT_BLOCK_PREFIX}${c.factory}` }))
}

export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Pipeline",
      categorystyle: "pipeline_category",
      contents: [{ kind: "block", type: PIPELINE_BLOCK_TYPE }],
    },
    {
      kind: "category",
      name: "Trainable",
      categorystyle: "trainable_category",
      contents: categoryContents("trainable"),
    },
    {
      kind: "category",
      name: "Rule-based",
      categorystyle: "rulebased_category",
      contents: categoryContents("rulebased"),
    },
    {
      kind: "category",
      name: "Utilities",
      categorystyle: "utility_category",
      contents: categoryContents("utility"),
    },
  ],
}
