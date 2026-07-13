/**
 * Shared primitives and string-literal unions reused across the website's
 * component and data types. These describe shapes that already exist at
 * runtime (inferred from the current PropTypes and destructuring in
 * `website/src/`); no `.tsx` source consumes them yet.
 */
import type { ReactNode } from 'react'

/**
 * Every icon key accepted by `components/icon.js`. Kept in sync with the
 * `icons` lookup table in that file.
 */
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

/** Colour treatment applied to an icon via its CSS module classes. */
export type IconVariant = 'success' | 'error' | 'subtle'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

export type TagVariant = 'new' | 'model'

export type AlertVariant = 'warning'

export type InfoboxVariant = 'default' | 'warning' | 'danger'

/** Colour theme applied per docs section (see `meta/site.json` `sections`). */
export type ThemeName = 'blue' | 'green' | 'purple' | 'nightly' | 'legacy'

/** Number of columns a `Grid` can lay out. */
export type GridCols = 1 | 2 | 3 | 4

/**
 * Language identifier for a code block. The `(string & {})` branch keeps the
 * suggested literals in autocomplete while still allowing any other highlighter
 * name that appears in the docs.
 */
export type CodeLang =
    | 'python'
    | 'bash'
    | 'json'
    | 'yaml'
    | 'markdown'
    | 'r'
    | 'cli'
    | (string & {})

/** Either a plain string or already-rendered React content. */
export type StringOrNode = string | ReactNode

/** Generic id + human-readable title pair, common in nav and data structures. */
export interface LabeledId {
    id: string
    title: string
}
