/**
 * Types for markdown/MDX rendering (components/markdownToReact.js,
 * markdownToReactDynamic.js, htmlToReact.js) and meta/dynamicMeta.mjs.
 */
import type { ElementType } from 'react'

/** Props for components/markdownToReact.js and its dynamic wrapper. */
export interface MarkdownToReactProps {
    markdown: string
}

/** Props for components/htmlToReact.js: renders a raw HTML string as React nodes. */
export interface HtmlToReactProps {
    children: string
    [key: string]: unknown
}

/**
 * Build-time site flags derived from the deploy domain, exported by
 * meta/dynamicMeta.mjs and threaded through templates/components as booleans.
 */
export interface DynamicMeta {
    domain: string
    siteUrl: string
    nightly: boolean
    legacy: boolean
    binderBranch: string
    branch: string
    replacements: Record<string, string>
}

/** A map of tag/component names to their React renderer, see src/remark.js `remarkComponents`. */
export type RemarkComponents = Record<string, ElementType>
