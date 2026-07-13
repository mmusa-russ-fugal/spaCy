import { describe, expect, it } from "vitest"

import { catalog } from "@/lib/catalog"
import { helpUrlFor } from "@/blockly/helpUrls"

describe("helpUrlFor", () => {
  it("maps factories whose docs slug differs from the factory name", () => {
    expect(helpUrlFor("ner")).toBe("https://spacy.io/api/entityrecognizer")
    expect(helpUrlFor("parser")).toBe("https://spacy.io/api/dependencyparser")
    expect(helpUrlFor("senter")).toBe("https://spacy.io/api/sentencerecognizer")
    expect(helpUrlFor("trainable_lemmatizer")).toBe(
      "https://spacy.io/api/edittreelemmatizer"
    )
    expect(helpUrlFor("attribute_ruler")).toBe("https://spacy.io/api/attributeruler")
    expect(helpUrlFor("textcat_multilabel")).toBe(
      "https://spacy.io/api/textcategorizer"
    )
  })

  it("points utility pipes at pipeline-functions anchors", () => {
    expect(helpUrlFor("token_splitter")).toBe(
      "https://spacy.io/api/pipeline-functions#token_splitter"
    )
    expect(helpUrlFor("merge_entities")).toBe(
      "https://spacy.io/api/pipeline-functions#merge_entities"
    )
  })

  it("produces a URL for every catalog factory", () => {
    for (const def of catalog) {
      expect(helpUrlFor(def.factory)).toMatch(/^https:\/\/spacy\.io\/api\//)
    }
  })
})
