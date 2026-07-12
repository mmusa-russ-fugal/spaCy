import { describe, expect, it } from "vitest"

import { generateConfig } from "@/lib/cfggen"
import { generatePython, pyLiteral } from "@/lib/pygen"
import { specFromWorkspace } from "@/lib/spec"
import {
  modelBaseWorkspace,
  rulerWorkspace,
  trainableWorkspace,
} from "./fixtures"

describe("pyLiteral", () => {
  it("renders Python literals", () => {
    expect(pyLiteral(true)).toBe("True")
    expect(pyLiteral(null)).toBe("None")
    expect(pyLiteral(["a", 1, false])).toBe('["a", 1, False]')
    expect(pyLiteral({ k: null })).toBe('{"k": None}')
  })
})

describe("generatePython", () => {
  it("renders a blank pipeline with ruler patterns", () => {
    const { spec } = specFromWorkspace(rulerWorkspace)
    const code = generatePython(spec!)
    expect(code).toContain('nlp = spacy.blank("en")')
    expect(code).toContain('nlp.add_pipe("sentencizer")')
    expect(code).toContain(
      'ruler = nlp.add_pipe("entity_ruler", config={"overwrite_ents": True, "phrase_matcher_attr": "LOWER"})'
    )
    expect(code).toContain('ruler.add_patterns([{"label": "ORG", "pattern": "Apple"}')
    expect(code).toContain('nlp.add_pipe("merge_entities")')
    expect(code).toMatch(/doc = nlp\(/)
  })

  it("renders a trained-model base and explicit names", () => {
    const modelCode = generatePython(specFromWorkspace(modelBaseWorkspace).spec!)
    expect(modelCode).toContain('nlp = spacy.load("en_core_web_sm")')
    const namedCode = generatePython(specFromWorkspace(trainableWorkspace).spec!)
    expect(namedCode).toContain('nlp.add_pipe("ner", name="my_ner")')
  })
})

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
})
