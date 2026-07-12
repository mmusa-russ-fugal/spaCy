/**
 * Types for the `pageContext` object generated per-page (from MDX frontmatter
 * plus build-time enrichment) and consumed by templates/{docs,models,universe,index}.js.
 */
import type { SidebarLeafItem } from './nav'

/** Reference to the next page in a doc's reading order. */
export interface NextPageRef {
    title: string
    slug: string
}

/** Page-level API cross-reference details rendered next to the title (see components/title.js). */
export interface ApiDetails {
    stringName?: string
    baseClass?: { slug: string; title: string }
    trainable?: boolean
    [key: string]: unknown
}

/** Extra metadata for a models-section index page (see templates/models.js). */
export interface ModelsPageMeta {
    models: string[]
    hasExamples?: boolean
    [key: string]: unknown
}

/** The `pageContext` shape passed into templates/docs.js and templates/index.js (Layout). */
export interface DocsPageContext {
    id?: string
    slug: string
    title: string
    section?: string
    sectionTitle?: string
    teaser?: string
    source?: string
    tag?: string
    isIndex?: boolean
    next?: NextPageRef
    /** Tuples of [headingText, headingId] used to build the in-page menu. */
    menu?: [string, string][]
    theme?: string
    version?: string
    apiDetails?: ApiDetails
    searchExclude?: boolean
    /** Present when a page overrides the section's default sidebar. */
    sidebar?: SidebarLeafItem[]
}

/**
 * The `pageContext` shape passed into templates/models.js `Models`. Distinct from
 * `DocsPageContext` despite the shared name and prop position — this template
 * destructures only `{ id, title, meta }`, not the richer docs page fields.
 */
export interface ModelsPageContext {
    id: string
    title: string
    meta: ModelsPageMeta
}

/** The `pageContext` shape passed into templates/universe.js. */
export interface UniversePageContext {
    slug: string
    theme?: string
    data?: {
        id?: string
        title?: string
        description?: string
        isCategory?: boolean
        isProject?: boolean
    }
}
