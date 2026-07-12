/**
 * Prop types for website/src/components/*.js, derived from each component's
 * existing PropTypes declarations (where present) and its destructured
 * arguments (where not).
 */
import type { ElementType, MouseEventHandler, ReactNode } from 'react'
import type {
    AlertVariant,
    ButtonVariant,
    GridCols,
    IconName,
    IconVariant,
    InfoboxVariant,
    StringOrNode,
} from './common'
import type { MenuCrumb, SidebarSection } from './nav'

export interface LinkProps {
    children: ReactNode
    to?: string
    href?: string
    onClick?: MouseEventHandler
    noLinkLayout?: boolean
    hideIcon?: boolean
    ws?: boolean
    forceExternal?: boolean
    className?: string
    [key: string]: unknown
}

export interface OptionalLinkProps {
    to?: string
    href?: string
    children: ReactNode
    [key: string]: unknown
}

export interface IconProps {
    name: IconName
    width?: number
    height?: number
    inline?: boolean
    variant?: IconVariant
    className?: string
    [key: string]: unknown
}

export interface ButtonProps {
    to?: string
    variant?: ButtonVariant
    large?: boolean
    icon?: IconName
    className?: string
    children: ReactNode
    [key: string]: unknown
}

export interface TagProps {
    spaced?: boolean
    tooltip?: string
    variant?: string
    children: ReactNode
}

export interface AlertProps {
    title?: string
    icon?: IconName
    variant?: AlertVariant
    closeOnClick?: boolean
    children?: ReactNode
}

export interface InfoboxProps {
    title?: ReactNode
    id?: string
    variant?: InfoboxVariant
    className?: string
    children: ReactNode
}

export interface AccordionProps {
    title?: string
    id?: string
    children: ReactNode
}

export interface CardProps {
    title?: ReactNode
    header?: ReactNode
    to?: string
    image?: string
    small?: boolean
    onClick?: MouseEventHandler
    children?: ReactNode
}

export interface GridProps {
    cols?: GridCols
    narrow?: boolean
    gutterBottom?: boolean
    className?: string
    children?: ReactNode
}

export interface SectionProps {
    id?: string
    className?: string
    [key: string]: unknown
}

export interface ContentProps {
    Component?: ElementType
    className?: string
    children?: ReactNode
}

export interface MainProps {
    sidebar?: boolean
    asides?: boolean
    wrapContent?: boolean
    theme?: string
    footer?: ReactNode
    children?: ReactNode
}

export interface HeadlineProps {
    Component: ElementType
    id?: string | false
    name?: string
    version?: string
    model?: string
    tag?: string
    source?: string
    hidden?: boolean | 'true' | 'false'
    action?: ReactNode
    permalink?: boolean
    className?: string
    children?: ReactNode
}

export interface InlineListProps {
    Component?: ElementType
    gutterBottom?: boolean
    className?: string
    children?: ReactNode
}

export interface HelpProps {
    children?: ReactNode
    className?: string
    size?: number
}

export interface AbbrProps {
    title?: string
    children?: ReactNode
}

export interface YouTubeProps {
    id: string
    ratio?: '16x9' | '4x3'
    className?: string
}

export interface SoundCloudProps {
    id: string
    title: string
    color?: string
}

export interface IframeProps {
    title: string
    src?: string
    html?: string
    width?: number
    height?: number
}

export interface EmbedImageProps {
    src: string
    alt?: string
    title?: string
    href?: string
    [key: string]: unknown
}

export interface ImageScrollableProps {
    src: string
    alt?: string
    width?: number
    [key: string]: unknown
}

export interface StandaloneProps {
    height?: number | string
    children?: ReactNode
    [key: string]: unknown
}

export interface ImageFillProps {
    image: { src: string; width: number; height: number }
    [key: string]: unknown
}

export interface GoogleSheetProps {
    id: string
    link?: string
    height?: number | string
    button?: string
}

export interface TableProps {
    fixed?: boolean
    className?: string
    [key: string]: unknown
}

export interface TrProps {
    evenodd?: boolean
    children?: ReactNode
    [key: string]: unknown
}

export interface TdProps {
    num?: boolean
    nowrap?: boolean
    className?: string
    children?: ReactNode
    [key: string]: unknown
}

export interface InlineCodeProps {
    wrap?: boolean
    className?: string
    children?: ReactNode
}

export interface TypeAnnotationProps {
    lang?: CodeLangUnion
    link?: boolean
    children?: ReactNode
}

// Kept local to avoid a circular import with common.ts's broader CodeLang alias.
type CodeLangUnion = 'python' | 'bash' | 'json' | 'yaml' | 'markdown' | 'r' | string

export interface LiProps {
    children?: ReactNode
    emoji?: string
    [key: string]: unknown
}

export interface CopyInputProps {
    text: string
    description?: string
    prefix?: string
}

export interface DropdownProps {
    defaultValue?: string
    className?: string
    onChange?: (event: unknown) => void
    children?: ReactNode
}

export interface ReadNextProps {
    title: string
    to: string
}

export interface FooterProps {
    wide?: boolean
}

export interface NewsletterProps {
    user: string
    id: string
    list: string
}

export interface SidebarProps {
    items?: SidebarSection[]
    pageMenu?: MenuCrumb[]
    slug?: string
}

export interface NavigationProps {
    title: string
    items?: { text: string; url: string }[]
    section?: string
    search?: ReactNode
    alert?: ReactNode
    children?: ReactNode
}

export interface SearchProps {
    id?: string
    placeholder?: string
}

export interface SEOProps {
    description?: string
    meta?: unknown[]
    keywords?: string[]
    title?: string
    section?: string
    sectionTitle?: string
    bodyClass?: string
    nightly?: boolean
    legacy?: boolean
    lang?: string
}

export interface TitleProps {
    title?: string
    tag?: string
    teaser?: StringOrNode
    source?: string
    image?: string
    version?: string
    id?: string
    apiDetails?: unknown
    children?: ReactNode
}

export interface GitHubCodeProps {
    url: string
    lang?: string
    errorMsg?: string
    className?: string
}

/** A single option row rendered within a Quickstart group, e.g. an OS/platform choice. */
export interface QuickstartOption {
    id: string
    title: string
    checked?: boolean
    help?: string
    meta?: string
}

/** A single dropdown option within a Quickstart group. */
export interface QuickstartDropdownOption {
    id: string
    title: string
}

/** A single configurable group of options rendered by the Quickstart widget. */
export interface QuickstartGroup {
    id: string
    title: string
    options?: QuickstartOption[]
    dropdown?: QuickstartDropdownOption[]
    defaultValue?: string
    multiple?: boolean
    other?: string
    help?: string
    hidden?: boolean
}

export interface QuickstartProps {
    data?: QuickstartGroup[]
    title?: StringOrNode
    description?: StringOrNode
    copy?: boolean
    download?: string
    rawContent?: string | null
    id?: string
    setters?: Record<string, (value: string | string[]) => void>
    showDropdown?: Record<string, () => boolean>
    hidePrompts?: boolean
    small?: boolean
    codeLang?: string
    Container?: ElementType
    children?: ReactNode
}

export interface QSProps {
    children?: ReactNode
    prompt?: string
    divider?: boolean
    comment?: boolean
    [key: string]: unknown
}
