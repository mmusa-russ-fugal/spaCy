/**
 * Prop types for `website/src/templates/*.js`, and the display-formatted model
 * metadata those templates derive at render time.
 */
import type { ReactNode } from 'react'
import type {
    LicenseInfo,
    ModelCompatibility,
    RawModelMeta,
    UniverseCategory,
    UniverseResource,
} from './site-data'
import type {
    DocsPageContext,
    ModelsPageContext,
    ModelsPageMeta,
    UniversePageContext,
} from './page-context'

export interface DocsProps {
    pageContext: DocsPageContext
    children?: ReactNode
}

/** Props for `templates/models.js` `Models` (a per-language models page). */
export interface ModelsTemplateProps {
    pageContext: ModelsPageContext
    repo: string
    children?: ReactNode
}

/** Props for `templates/models.js` `Model` (one trained pipeline entry). */
export interface ModelEntryProps {
    name: string
    langId: string
    langName: string
    baseUrl: string
    repo: string
    compatibility: ModelCompatibility
    /** Models pages pass `has_examples || null` (see `pages/models/[slug].tsx`). */
    hasExamples?: boolean | null
    licenses: Record<string, LicenseInfo>
    prereleases?: boolean
}

/** One labelled accuracy metric row in a formatted model card. */
export interface FormattedModelAccuracy {
    label: string
    value: string
    help?: string
}

/**
 * Model metadata after `formatModelMeta()` in `templates/models.js` has
 * prepared it for display.
 */
export interface FormattedModelMeta {
    fullName: string
    version: string
    sizeFull: string
    pipeline?: string[]
    components?: string[]
    notes?: string
    description?: string
    /** Left unformatted here; rendered later by `formatSources()`. */
    sources?: RawModelMeta['sources']
    author?: string
    url?: string
    license?: string
    labels: Record<string, string[]> | null
    vectors: string
    accuracy: FormattedModelAccuracy[]
    download_link: ReactNode
}

export interface UniverseContentProps {
    content?: UniverseResource[]
    categories: UniverseCategory[]
    theme?: string
    pageContext: UniversePageContext
    mdxComponents?: Record<string, unknown>
    location?: unknown
}

export interface UniverseTemplateProps {
    pageContext: UniversePageContext
    location?: unknown
    mdxComponents?: Record<string, unknown>
}

export interface UniverseProjectProps {
    data: UniverseResource
    components?: Record<string, unknown>
}

export interface SpaCyVersionProps {
    version: string | number | (string | number)[]
}

export interface ImageGitHubProps {
    url: string
    isRounded?: boolean
    title?: string
}

/**
 * Props for `templates/index.js` `Layout`. Pages spread their page context
 * straight into `<Layout>` (see `pages/[...listPathPage].tsx` and the
 * `export default Layout` universe pages), so this is a partial view of
 * `DocsPageContext` plus the models/universe extras and the gatsby-era
 * `scope`/`location` passthroughs. `section` may arrive as an explicit `null`
 * from `getStaticProps` (like `sectionTitle`/`teaser`/`theme` already do).
 */
export interface LayoutProps extends Partial<Omit<DocsPageContext, 'section'>> {
    section?: string | null
    scope?: Record<string, unknown>
    location?: unknown
    /** Models pages: pipeline metadata consumed by `templates/models.js`. */
    meta?: ModelsPageMeta
    /** Universe pages: the active category/project entry. */
    data?: UniversePageContext['data']
    children?: ReactNode
}
