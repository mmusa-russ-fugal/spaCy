/**
 * Prop types for website/src/templates/*.js.
 */
import type { ReactNode } from 'react'
import type {
    ModelCompatibility,
    RawModelMeta,
    UniverseCategory,
    UniverseResource,
} from './site-data'
import type { DocsPageContext, ModelsPageContext, UniversePageContext } from './page-context'

export interface DocsProps {
    pageContext: DocsPageContext
    children?: ReactNode
}

/** Props for templates/models.js `Models` (the per-language models page). */
export interface ModelsTemplateProps {
    pageContext: ModelsPageContext
    repo: string
    children?: ReactNode
}

/** Props for templates/models.js `Model` (a single trained pipeline entry). */
export interface ModelEntryProps {
    name: string
    langId: string
    langName: string
    baseUrl: string
    repo: string
    compatibility: ModelCompatibility
    hasExamples?: boolean
    licenses: Record<string, { id: string; url: string }>
    prereleases?: boolean
}

/** Formatted metadata derived from RawModelMeta for display, see formatModelMeta() in models.js. */
export interface FormattedModelMeta {
    fullName: string
    version: string
    sizeFull: string
    pipeline?: string[]
    components?: string[]
    notes?: string
    description?: string
    sources?: ReactNode
    author?: string
    url?: string
    license?: string
    labels: Record<string, string[]> | null
    vectors: string
    accuracy: { label: string; value: string; help?: string }[]
    download_link: ReactNode
}

export type { RawModelMeta }

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

/** Props for templates/index.js `Layout`, spread from a page's pageContext plus MDX scope. */
export interface LayoutProps {
    scope?: Record<string, unknown>
    pageContext?: DocsPageContext
    location?: unknown
    children?: ReactNode
    title?: string
    section?: string
    sectionTitle?: string
    teaser?: string
    theme?: string
    searchExclude?: boolean
}
