import { describe, expect, it } from "vitest"

import { generatePython, pyLiteral } from "@/lib/pygen"
import { specFromWorkspace } from "@/lib/spec"
import {
  duplicateWorkspace,
  modelBaseWorkspace,
  rulerWorkspace,
  trainableWorkspace,
} from "@/lib/testFixtures"

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

  it("emits name= for a uniquified duplicate so add_pipe does not raise E007", () => {
    const code = generatePython(specFromWorkspace(duplicateWorkspace).spec!)
    expect(code).toContain('nlp.add_pipe("sentencizer")')
    expect(code).toContain('nlp.add_pipe("sentencizer", name="sentencizer_2")')
  })
})
