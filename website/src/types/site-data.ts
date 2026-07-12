/**
 * Types describing the static JSON data consumed from website/meta/*.json.
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

export interface SiteSection {
    id: string
    title: string
    theme: string
}

/** Shape of meta/site.json. */
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
    /** Injected dynamically at build time, see meta/dynamicMeta.mjs. */
    nightly?: boolean
}

/** Shape of meta/sidebars.json. */
export type SidebarsData = SidebarConfig[]

/** A single dependency required by a language's tokenizer, e.g. `python -m spacy download`. */
export interface LanguageDependency {
    name: string
    url: string
}

/** A single language entry from meta/languages.json `languages`. */
export interface LanguageInfo {
    code: string
    name: string
    example?: string
    has_examples?: boolean
    models?: string[]
    dependencies?: LanguageDependency[]
}

/** A license entry from meta/languages.json `licenses`. */
export interface LicenseInfo {
    id: string
    url: string
}

/** Shape of meta/languages.json. */
export interface LanguagesData {
    languages: LanguageInfo[]
    licenses: LicenseInfo[]
}

/** Author social links for a Universe resource. */
export interface UniverseAuthorLinks {
    twitter?: string
    github?: string
    website?: string
}

/** A single project/resource entry from meta/universe.json `resources`. */
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

/** An item within a Universe category from meta/universe.json `categories`. */
export interface UniverseCategoryItem {
    id: string
    title: string
    description: string
}

/** A category grouping of Universe resources. */
export interface UniverseCategory {
    label: string
    items: UniverseCategoryItem[]
}

/** Shape of meta/universe.json. */
export interface UniverseData {
    resources: UniverseResource[]
    categories: UniverseCategory[]
}

/** Shape of meta/type-annotations.json: maps a type name to its docs URL. */
export type TypeAnnotationsData = Record<string, string>

/** Per-model accuracy/speed performance metrics, keyed by metric name (see MODEL_META). */
export type ModelPerformance = Record<string, number>

/** Word vector metadata for a trained pipeline, as reported in its `meta.json`. */
export interface ModelVectorsMeta {
    keys: number
    vectors: number
    width: number
}

/** Raw metadata fetched from a trained pipeline's `<name>-<version>.json` on GitHub. */
export interface RawModelMeta {
    lang: string
    name: string
    version: string
    size: string
    pipeline?: string[]
    components?: string[]
    notes?: string
    description?: string
    sources?: (string | { name: string; url?: string; author?: string })[]
    author?: string
    url?: string
    license?: string
    labels?: Record<string, string[]>
    vectors?: ModelVectorsMeta
    performance?: ModelPerformance
}

/** Compatibility table fetched from `compatibility.json`: version -> modelId -> available model versions. */
export type ModelCompatibility = Record<string, Record<string, string[]>>
