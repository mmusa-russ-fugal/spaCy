/**
 * The `pageContext` objects produced per page (MDX frontmatter enriched at
 * build time) and consumed by `templates/{docs,models,universe,index}.js`.
 */
import type { SidebarLeafItem } from './nav'

/** The next page in a doc's reading order. */
export interface NextPageRef {
    title: string
    slug: string
}

/** API cross-reference details rendered beside a page title (`components/title.js`). */
export interface ApiDetails {
    stringName?: string
    baseClass?: { slug: string; title: string }
    trainable?: boolean
    [key: string]: unknown
}

/** Extra metadata for a models-section index page (`templates/models.js`). */
export interface ModelsPageMeta {
    models: string[]
    hasExamples?: boolean
    [key: string]: unknown
}

/** The `pageContext` passed to `templates/docs.js` and `templates/index.js`. */
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
    /** `[headingText, headingId]` tuples used to build the in-page menu. */
    menu?: [string, string][]
    theme?: string
    version?: string
    apiDetails?: ApiDetails
    searchExclude?: boolean
    /** Present when a page overrides its section's default sidebar. */
    sidebar?: SidebarLeafItem[]
}

/**
 * The `pageContext` passed to `templates/models.js` `Models`. Despite sharing a
 * name with `DocsPageContext`, this template only reads `{ id, title, meta }`.
 */
export interface ModelsPageContext {
    id: string
    title: string
    meta: ModelsPageMeta
}

/** The `pageContext` passed to `templates/universe.js`. */
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
