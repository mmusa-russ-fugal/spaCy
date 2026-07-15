import { describe, expect, it } from "vitest"

import { catalog, factoryMeta } from "@/lib/catalog"
import { specFromWorkspace } from "@/lib/spec"
import { validateSpec } from "@/lib/validate"
import {
  modelBaseWorkspace,
  rulerWorkspace,
  trainableWorkspace,
} from "@/lib/testFixtures"

describe("catalog drift", () => {
  it("every catalog entry has generated factory metadata", () => {
    for (const def of catalog) {
      expect(factoryMeta[def.factory], `missing meta for ${def.factory}`).toBeDefined()
    }
  })

  it("every catalog config field exists in the factory default_config", () => {
    for (const def of catalog) {
      for (const field of def.fields) {
        if (field.isPatterns) continue
        expect(
          Object.prototype.hasOwnProperty.call(
            factoryMeta[def.factory].defaultConfig,
            field.key
          ),
          `${def.factory}.${field.key} not in default_config`
        ).toBe(true)
      }
    }
  })
})

describe("validateSpec", () => {
  it("passes a well-ordered rule-based pipeline", () => {
    const { spec, issues } = specFromWorkspace(rulerWorkspace)
    const warnings = validateSpec(spec!, issues)
    expect(warnings.filter((w) => w.level === "warning")).toEqual([])
  })

  it("warns when merge_entities has no entity source before it", () => {
    const { spec } = specFromWorkspace(rulerWorkspace)
    spec!.components = spec!.components.filter((c) => c.factory !== "entity_ruler")
    const warnings = validateSpec(spec!)
    expect(
      warnings.some(
        (w) => w.level === "warning" && w.message.includes("doc.ents")
      )
    ).toBe(true)
  })

  it("flags untrained trainable components on a blank base", () => {
    const { spec } = specFromWorkspace(trainableWorkspace)
    const warnings = validateSpec(spec!)
    const untrained = warnings.filter((w) => w.message.includes("untrained"))
    expect(untrained).toHaveLength(3) // tok2vec, tagger, ner
  })

  it("skips requires and untrained checks on a trained-model base", () => {
    const { spec } = specFromWorkspace(modelBaseWorkspace)
    expect(validateSpec(spec!)).toEqual([])
  })

  it("warns about duplicate-name (E007) when re-adding core pipes on a model base", () => {
    const { spec } = specFromWorkspace(trainableWorkspace)
    spec!.base = { type: "model", name: "en_core_web_sm" }
    const warnings = validateSpec(spec!)
    const collisions = warnings.filter((w) => w.message.includes("E007"))
    // tok2vec + tagger keep their factory name; ner was renamed to my_ner.
    expect(collisions.map((w) => w.blockId)).toEqual(["t1", "t2"])
  })
})
