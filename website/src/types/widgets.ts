/**
 * Prop types for website/src/widgets/*.js.
 */
import type { ReactNode } from 'react'
import type { LanguageDependency } from './site-data'

export type IntegrationLogoName =
    | 'dvc'
    | 'prodigy'
    | 'streamlit'
    | 'fastapi'
    | 'wandb'
    | 'ray'
    | 'huggingface_hub'

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
    dependencies?: LanguageDependency[]
}

export interface QuickstartInstallWidgetProps {
    id?: string
    title?: string
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
