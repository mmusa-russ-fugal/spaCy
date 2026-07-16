import { describe, expect, it } from "vitest"

import { highlightCode } from "./highlight"

describe("highlightCode", () => {
  it("tokenizes Python source", () => {
    const html = highlightCode('import spacy\nnlp = spacy.blank("en")', "python")
    expect(html).toContain('<span class="token keyword">import</span>')
    expect(html).toContain('<span class="token string">"en"</span>')
  })

  it("tokenizes INI / config source", () => {
    const html = highlightCode(
      '[components.tagger]\n# a comment\nfactory = "tagger"',
      "ini"
    )
    expect(html).toContain('class="token section"')
    expect(html).toContain('class="token comment"')
    expect(html).toContain("attr-name")
  })

  it("escapes untokenized text so it is safe as HTML", () => {
    const html = highlightCode("value = a < b & c", "ini")
    expect(html).toContain("&lt;")
    expect(html).toContain("&amp;")
    expect(html).not.toContain("< b")
  })
})
