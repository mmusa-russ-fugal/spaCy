/**
 * Prop types for `website/src/widgets/*.js`.
 */
import type { CSSProperties, ReactNode } from 'react'

/** Named logos rendered by the integration widget. */
export type IntegrationLogoName =
    'dvc' | 'prodigy' | 'streamlit' | 'fastapi' | 'wandb' | 'ray' | 'huggingface_hub'

export interface IntegrationLogoProps {
    name: IntegrationLogoName
    title?: string
    width?: number | string
    height?: number | string
    maxWidth?: number | string
    /** Applied as the CSS `float` of the logo (`'none'` when unset). */
    align?: CSSProperties['float']
    [key: string]: unknown
}

export interface IntegrationProps {
    height?: number
    url?: string
    /** Passed through as the `IntegrationLogo` name. */
    logo?: IntegrationLogoName
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

/**
 * Preset ids for the Blockly pipeline builder — one per docs location the
 * widget is embedded at (see `src/widgets/blockly/presets.ts`).
 */
export type BlocklyPresetId =
    'spacy-101' | 'pipelines-overview' | 'training-config' | 'api-add-pipe'

export interface BlocklyPipelineBuilderProps {
    preset: BlocklyPresetId
    title?: string
}

export interface QuickstartModelsWidgetProps {
    id?: string
    title?: string
    description?: ReactNode
    children?: ReactNode
}

export interface StyleguideCardProps {
    /** Merged into the card header's inline style. */
    style?: CSSProperties
    children?: ReactNode
}
