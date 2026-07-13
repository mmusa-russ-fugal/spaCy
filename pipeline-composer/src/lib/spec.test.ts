import { describe, expect, it } from "vitest"

import { specFromWorkspace } from "@/lib/spec"
import {
  duplicateWorkspace,
  modelBaseWorkspace,
  rulerWorkspace,
  trainableWorkspace,
} from "@/lib/testFixtures"

describe("specFromWorkspace", () => {
  it("returns null spec for an empty workspace", () => {
    const { spec, issues } = specFromWorkspace({ blocks: { blocks: [] } })
    expect(spec).toBeNull()
    expect(issues).toEqual([])
  })

  it("parses a rule-based pipeline with patterns and overrides", () => {
    const { spec, issues } = specFromWorkspace(rulerWorkspace)
    expect(issues).toEqual([])
    expect(spec).not.toBeNull()
    expect(spec!.lang).toBe("en")
    expect(spec!.base).toEqual({ type: "blank" })
    expect(spec!.components.map((c) => c.factory)).toEqual([
      "sentencizer",
      "entity_ruler",
      "merge_entities",
    ])
    const ruler = spec!.components[1]
    // overrides only: defaults (overwrite_ents=false) differ, so both are kept
    expect(ruler.config).toEqual({
      overwrite_ents: true,
      phrase_matcher_attr: "LOWER",
    })
    expect(ruler.patterns).toHaveLength(2)
    // sentencizer left at defaults -> empty config
    expect(spec!.components[0].config).toEqual({})
  })

  it("keeps explicit names and skips default-valued fields", () => {
    const { spec } = specFromWorkspace(trainableWorkspace)
    const [tok2vec, tagger, ner] = spec!.components
    expect(tok2vec.name).toBe("tok2vec")
    expect(tok2vec.explicitName).toBe(false)
    expect(tagger.config).toEqual({}) // overwrite=false is the default
    expect(ner.name).toBe("my_ner")
    expect(ner.explicitName).toBe(true)
  })

  it("parses a trained-model base", () => {
    const { spec } = specFromWorkspace(modelBaseWorkspace)
    expect(spec!.base).toEqual({ type: "model", name: "en_core_web_sm" })
    // silent=true is doc_cleaner's default, so no override
    expect(spec!.components[0].config).toEqual({})
  })

  it("uniquifies duplicate implicit names without complaining", () => {
    const { spec, issues } = specFromWorkspace(duplicateWorkspace)
    expect(spec!.components.map((c) => c.name)).toEqual([
      "sentencizer",
      "sentencizer_2",
    ])
    expect(issues).toEqual([])
  })

  it("flags invalid pattern JSON as an issue", () => {
    const broken = structuredClone(rulerWorkspace) as Record<string, any>
    broken.blocks.blocks[0].inputs.COMPONENTS.block.next.block.fields.F_PATTERNS =
      "not json"
    const { spec, issues } = specFromWorkspace(broken)
    expect(issues.some((i) => i.message.includes("Invalid JSON pattern"))).toBe(true)
    expect(spec!.components[1].patterns).toBeUndefined()
  })
})
