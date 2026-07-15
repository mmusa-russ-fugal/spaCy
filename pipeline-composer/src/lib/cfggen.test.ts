import { describe, expect, it } from "vitest"

import { generateConfig } from "@/lib/cfggen"
import { specFromWorkspace } from "@/lib/spec"
import { rulerWorkspace, trainableWorkspace } from "@/lib/testFixtures"

describe("generateConfig", () => {
  it("renders [nlp] and [components.*] sections with overrides only", () => {
    const { spec } = specFromWorkspace(rulerWorkspace)
    const cfg = generateConfig(spec!)
    expect(cfg).toContain("[nlp]")
    expect(cfg).toContain('lang = "en"')
    expect(cfg).toContain('pipeline = ["sentencizer","entity_ruler","merge_entities"]')
    expect(cfg).toContain("\n[components]\n")
    expect(cfg).toContain("[components.entity_ruler]")
    expect(cfg).toContain('factory = "entity_ruler"')
    expect(cfg).toContain("overwrite_ents = true")
    expect(cfg).toContain('phrase_matcher_attr = "LOWER"')
    // defaults not repeated
    expect(cfg).not.toContain("ent_id_sep")
    // patterns can't go in cfg — noted as comment
    expect(cfg).toContain("not expressible in config.cfg")
  })

  it("uses uniquified names as section keys", () => {
    const { spec } = specFromWorkspace(trainableWorkspace)
    spec!.components[2].name = "my_ner"
    const cfg = generateConfig(spec!)
    expect(cfg).toContain("[components.my_ner]")
    expect(cfg).toContain('pipeline = ["tok2vec","tagger","my_ner"]')
  })

  it("falls back to the factory name instead of emitting a malformed section for an invalid name", () => {
    const broken = structuredClone(rulerWorkspace) as Record<string, any>
    broken.blocks.blocks[0].inputs.COMPONENTS.block.fields.NAME = "bad name]"
    const { spec } = specFromWorkspace(broken)
    const cfg = generateConfig(spec!)
    expect(cfg).not.toContain("bad name]")
    expect(cfg).toContain("[components.sentencizer]")
  })
})
