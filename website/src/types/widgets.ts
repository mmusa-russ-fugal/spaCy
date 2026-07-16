/**
 * Prop types for `website/src/widgets/*.js`.
 */
import type { ReactNode } from 'react'

/** Named logos rendered by the integration widget. */
export type IntegrationLogoName =
    'dvc' | 'prodigy' | 'streamlit' | 'fastapi' | 'wandb' | 'ray' | 'huggingface_hub'

export interface IntegrationLogoProps {
    name: IntegrationLogoName
    title?: string
    width?: number | string
    height?: number | string
    maxWidth?: number | string
    align?: string
    [key: string]: unknown
}

export interface IntegrationProps {
    height?: number
    url?: string
    logo?: string
    title?: string
    children?: ReactNode
}

export interface LanguageRowProps {
    name: string
    code: string
    models?: string[]
}

export interface QuickstartInstallWidgetProps {
    id?: string
    title?: string
}

export interface ProjectWidgetProps {
    title?: string
    id: string
    /** Overrides the default projects repo from `meta/site.json`. */
    repo?: string
    children?: ReactNode
}

export interface QuickstartTrainingWidgetProps {
    id?: string
    title?: string
    download?: string
}

export interface QuickstartModelsWidgetProps {
    id?: string
    title?: string
    description?: ReactNode
    children?: ReactNode
}

export interface StyleguideCardProps {
    style?: Record<string, string | number>
    children?: ReactNode
}
