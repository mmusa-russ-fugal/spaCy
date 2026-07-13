import { describe, expect, it } from "vitest"

import { componentBlockJson } from "@/blockly/blocks"
import { catalogByFactory, factoryMeta } from "@/lib/catalog"
import { fieldName } from "@/lib/spec"

function fieldControl(factory: string, key: string): Record<string, unknown> {
  const json = componentBlockJson(catalogByFactory[factory])
  const args = json.args0 as Record<string, unknown>[]
  const control = args.find((a) => a.name === fieldName(key))
  if (!control) throw new Error(`no control for ${factory}.${key}`)
  return control
}

describe("componentBlockJson field seeding", () => {
  it("seeds checkbox defaults from the factory config", () => {
    // Real defaults are true; a fresh block must not silently flip them off.
    expect(fieldControl("morphologizer", "overwrite").checked).toBe(true)
    expect(fieldControl("doc_cleaner", "silent").checked).toBe(true)
    // Real default false stays false.
    expect(fieldControl("tagger", "overwrite").checked).toBe(false)
  })

  it("seeds number defaults from the factory config", () => {
    expect(fieldControl("token_splitter", "min_length").value).toBe(25)
    expect(fieldControl("token_splitter", "split_length").value).toBe(10)
    expect(fieldControl("textcat_multilabel", "threshold").value).toBe(0.5)
    expect(fieldControl("spancat", "threshold").value).toBe(0.5)
    expect(fieldControl("trainable_lemmatizer", "top_k").value).toBe(1)
  })

  it("leads every dropdown with the __default__ sentinel", () => {
    const dropdown = fieldControl("lemmatizer", "mode")
    const options = dropdown.options as [string, string][]
    expect(options[0][1]).toBe("__default__")
  })

  it("seeds all catalog number/checkbox fields from factory defaults", () => {
    for (const def of catalogByFactory ? Object.values(catalogByFactory) : []) {
      const defaults = factoryMeta[def.factory].defaultConfig
      for (const field of def.fields) {
        if (field.widget === "checkbox") {
          expect(fieldControl(def.factory, field.key).checked).toBe(
            defaults[field.key] === true
          )
        } else if (field.widget === "number") {
          const expected =
            typeof defaults[field.key] === "number" ? defaults[field.key] : 0
          expect(fieldControl(def.factory, field.key).value).toBe(expected)
        }
      }
    }
  })
})
