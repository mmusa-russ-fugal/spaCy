/**
 * The `pageContext` objects produced per page (MDX frontmatter enriched at
 * build time) and consumed by `templates/{docs,models,universe,index}.js`.
 */
import type { SidebarSection } from './nav'

/** The next page in a doc's reading order. */
export interface NextPageRef {
    title: string
    slug: string
}

/**
 * API cross-reference details rendered beside a page title (`components/title.js`).
 * Built in `pages/[...listPathPage].tsx` with explicit `null` fallbacks, so every
 * field is nullable rather than merely optional.
 */
export interface ApiDetails {
    stringName: string | null
    baseClass: { slug: string; title: string } | null
    trainable: boolean | null
    [key: string]: unknown
}

/** Extra metadata for a models-section index page (`templates/models.js`). */
export interface ModelsPageMeta {
    models: string[] | null
    example?: string | null
    hasExamples?: boolean | null
    [key: string]: unknown
}

/** The `pageContext` passed to `templates/docs.js` and `templates/index.js`. */
export interface DocsPageContext {
    id?: string
    slug: string
    title: string
    section?: string
    /** Producing pages emit explicit `null` (via `getStaticProps`) when absent. */
    sectionTitle?: string | null
    teaser?: string | null
    source?: string
    tag?: string
    isIndex?: boolean
    next?: NextPageRef | null
    /** `[headingText, headingId]` tuples used to build the in-page menu. */
    menu?: [string, string][]
    theme?: string | null
    version?: string
    apiDetails?: ApiDetails
    searchExclude?: boolean
    /**
     * Present on models pages only (`pages/models/[slug].tsx`), which route
     * through `templates/docs.js` into `templates/models.js`.
     */
    meta?: ModelsPageMeta
    /**
     * Present when a page overrides its section's default sidebar with
     * labelled groups from its frontmatter (see `docs/styleguide.mdx`);
     * `templates/docs.js` wraps it as `{ items: pageContext.sidebar }`.
     */
    sidebar?: SidebarSection[]
}

/**
 * The `pageContext` passed to `templates/models.js` `Models`. Despite sharing a
 * name with `DocsPageContext`, this template only reads `{ id, title, meta }`;
 * `slug` is always present too (see `pages/models/[slug].tsx`) and keeps this
 * type overlapping with `DocsPageContext` at the `templates/docs.js` seam.
 */
export interface ModelsPageContext {
    id: string
    slug: string
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
