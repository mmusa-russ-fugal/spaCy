import * as Prism from "prismjs"
// Grammars are registered as side effects on the shared Prism instance.
// Import order matters: core (above) must run before these attach.
import "prismjs/components/prism-python.min.js"
import "prismjs/components/prism-ini.min.js"

/** Languages the composer highlights. spaCy config.cfg is INI-like. */
export type HighlightLang = "python" | "ini"

/**
 * Highlight `code` and return Prism's token HTML string. Mirrors the
 * docs-embedded builder (`website/src/widgets/blockly/builder.tsx`), which
 * uses `Prism.highlight` with the same python/ini grammars. Colours are
 * applied by the `.prism-code` token styles in `index.css`, which adapt to
 * the app's light/dark theme.
 *
 * The returned HTML is display-only; callers keep the raw `code` for
 * copy/download so the clipboard never receives markup.
 */
export function highlightCode(code: string, lang: HighlightLang): string {
  const grammar = Prism.languages[lang]
  if (!grammar) return escapeHtml(code)
  return Prism.highlight(code, grammar, lang)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
