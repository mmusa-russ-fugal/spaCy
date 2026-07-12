/**
 * Shared primitive types and string-literal unions used across the website.
 * Central location for the planned JS -> TypeScript migration: these types
 * describe existing runtime shapes (derived from current PropTypes/usage)
 * and are not yet consumed by any .tsx source.
 */
import type { ReactNode } from 'react'

export type IconName =
    | 'github'
    | 'twitter'
    | 'website'
    | 'warning'
    | 'danger'
    | 'info'
    | 'accept'
    | 'reject'
    | 'docs'
    | 'code'
    | 'help'
    | 'help2'
    | 'arrowright'
    | 'yes'
    | 'no'
    | 'neutral'
    | 'offline'
    | 'search'
    | 'moon'
    | 'clipboard'
    | 'network'
    | 'download'
    | 'package'

export type IconVariant = 'success' | 'error' | 'subtle'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

export type TagVariant = 'new' | 'model'

export type AlertVariant = 'warning'

export type InfoboxVariant = 'default' | 'warning' | 'danger'

export type ThemeName = 'blue' | 'green' | 'purple' | 'nightly' | 'legacy'

export type GridCols = 1 | 2 | 3 | 4

export type CodeLang = 'python' | 'bash' | 'json' | 'yaml' | 'markdown' | 'r' | string

/** A value that can be either a plain string or pre-rendered React content. */
export type StringOrNode = string | ReactNode

/** Common shape for a generic label/id pair used throughout nav + data structures. */
export interface LabeledId {
    id: string
    title: string
}
