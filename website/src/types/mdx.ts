/**
 * Markdown/MDX rendering (`components/markdownToReact.js`,
 * `markdownToReactDynamic.js`, `htmlToReact.js`) and the build-time meta
 * exported from `meta/dynamicMeta.mjs`.
 */
import type { ElementType } from 'react'

/** Props for `markdownToReact.js` and its dynamic wrapper. */
export interface MarkdownToReactProps {
    markdown: string
}

/** Props for `htmlToReact.js`: renders a raw HTML string as React nodes. */
export interface HtmlToReactProps {
    children: string
    [key: string]: unknown
}

/**
 * Build-time flags derived from the deploy domain, exported by
 * `meta/dynamicMeta.mjs` and threaded through templates and components.
 */
export interface DynamicMeta {
    domain: string
    siteUrl: string
    nightly: boolean
    legacy: boolean
    binderBranch: string
    branch: string
    /** MDX text replacements, e.g. `GITHUB_SPACY` -> the resolved repo URL. */
    replacements: Record<string, string>
}

/** Map of tag/component names to their React renderer (see `src/remark.ts`). */
export type RemarkComponents = Record<string, ElementType>
