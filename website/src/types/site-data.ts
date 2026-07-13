/**
 * Static JSON data loaded from `website/meta/*.json`, plus the remote model
 * metadata fetched at render time by `templates/models.js`.
 */
import type { FooterColumn, NavigationItem, SidebarConfig } from './nav'

export interface SiteSocial {
    twitter: string
    github: string
}

export interface SiteNewsletter {
    user: string
    id: string
    list: string
}

export interface SiteDocSearch {
    appId: string
    indexName: string
}

/** A docs section with its colour theme (`meta/site.json` `sections`). */
export interface SiteSection {
    id: string
    title: string
    theme: string
}

/**
 * Shape of `meta/site.json`. Intentionally omits `nightly`: it is not stored in
 * `site.json` but derived at build time in `meta/dynamicMeta.mjs` (exported as
 * `nightly` from `nightlyBranches`). Code reaching for `siteMetadata.nightly`
 * (e.g. `templates/models.js`) should use that dynamic meta instead.
 */
export interface SiteMetadata {
    title: string
    description: string
    slogan: string
    domain: string
    nightlyBranches: string[]
    legacy: boolean
    email: string
    company: string
    companyUrl: string
    repo: string
    modelsRepo: string
    projectsRepo: string
    social: SiteSocial
    theme: string
    newsletter: SiteNewsletter
    docSearch: SiteDocSearch
    binderUrl: string
    binderVersion: string
    sections: SiteSection[]
    navigation: NavigationItem[]
    footer: FooterColumn[]
}

/** Shape of `meta/sidebars.json`. */
export type SidebarsData = SidebarConfig[]

/** A tokenizer dependency for a language (`meta/languages.json`). */
export interface LanguageDependency {
    name: string
    url: string
}

/** A language entry from `meta/languages.json` `languages`. */
export interface LanguageInfo {
    code: string
    name: string
    example?: string
    has_examples?: boolean
    models?: string[]
    dependencies?: LanguageDependency[]
}

/** A license entry from `meta/languages.json` `licenses`. */
export interface LicenseInfo {
    id: string
    url: string
}

/** Shape of `meta/languages.json`. */
export interface LanguagesData {
    languages: LanguageInfo[]
    licenses: LicenseInfo[]
}

/** Author social links attached to a Universe resource. */
export interface UniverseAuthorLinks {
    twitter?: string
    github?: string
    website?: string
}

/**
 * A single project/resource from `meta/universe.json` `resources`. Almost every
 * field is optional: entries range from packages to videos to books, and each
 * type populates a different subset.
 */
export interface UniverseResource {
    id: string
    type?: string
    title?: string
    slogan?: string
    description?: string
    github?: string
    pip?: string
    cran?: string
    code_example?: string[]
    code_language?: string
    category?: string[]
    tags?: string[]
    thumb?: string
    cover?: string
    image?: string
    url?: string
    youtube?: string
    soundcloud?: string
    iframe?: string
    iframe_height?: number
    author?: string
    author_links?: UniverseAuthorLinks
    spacy_version?: string | number | (string | number)[]
}

/** A selectable category within a Universe category group. */
export interface UniverseCategoryItem {
    id: string
    title: string
    description: string
}

/** A labelled grouping of Universe categories (`categories` in universe.json). */
export interface UniverseCategory {
    label: string
    items: UniverseCategoryItem[]
}

/** Shape of `meta/universe.json`. */
export interface UniverseData {
    resources: UniverseResource[]
    categories: UniverseCategory[]
}

/** `meta/type-annotations.json`: maps a type name to its documentation URL. */
export type TypeAnnotationsData = Record<string, string>

/** Accuracy/speed metrics for a trained pipeline, keyed by metric name. */
export type ModelPerformance = Record<string, number>

/** Word-vector metadata reported in a pipeline's `meta.json`. */
export interface ModelVectorsMeta {
    keys: number
    vectors: number
    width: number
}

/** A named source that a trained pipeline was built from. */
export interface ModelSource {
    name: string
    url?: string
    author?: string
}

/**
 * Metadata fetched from a trained pipeline's `<name>-<version>.json` on GitHub,
 * before formatting for display.
 */
export interface RawModelMeta {
    lang: string
    name: string
    version: string
    size: string
    pipeline?: string[]
    components?: string[]
    notes?: string
    description?: string
    sources?: (string | ModelSource)[]
    author?: string
    url?: string
    license?: string
    labels?: Record<string, string[]>
    vectors?: ModelVectorsMeta
    performance?: ModelPerformance
}

/**
 * Compatibility table from `compatibility.json`:
 * spaCy version -> model id -> list of available model versions.
 */
export type ModelCompatibility = Record<string, Record<string, string[]>>
