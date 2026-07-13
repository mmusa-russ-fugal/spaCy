/**
 * Prop types for `website/src/components/*.js`, derived from each component's
 * PropTypes declaration where present and its destructured arguments otherwise.
 *
 * Components that forward arbitrary attributes to a DOM element keep an
 * `[key: string]: unknown` index signature to mirror that pass-through.
 */
import type { CSSProperties, ElementType, MouseEventHandler, ReactNode } from 'react'
import type {
    AlertVariant,
    ButtonVariant,
    CodeLang,
    GridCols,
    IconName,
    IconVariant,
    InfoboxVariant,
    StringOrNode,
    TagVariant,
} from './common'
import type { MenuCrumb, NavigationItem, SidebarSection } from './nav'
import type { ApiDetails } from './page-context'

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
    variant?: TagVariant
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
    emoji?: string
    id?: string
    variant?: InfoboxVariant
    list?: boolean
    className?: string
    children: ReactNode
}

export interface AsideProps {
    title?: string
    children: ReactNode
}

export interface AccordionProps {
    title?: string
    id?: string
    expanded?: boolean
    spaced?: boolean
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
    /** `null` is tolerated at runtime (see `LandingBanner`) and means 1 column. */
    cols?: GridCols | null
    narrow?: boolean
    gutterBottom?: boolean
    style?: CSSProperties
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
    /** MDX may pass this as a stringified boolean. */
    hidden?: boolean | 'true' | 'false'
    action?: ReactNode
    permalink?: boolean
    className?: string
    children?: ReactNode
}

/** `H1`-`H5` wrap `Headline`, forwarding any extra props (see `HeadlineProps`). */
export interface H1Props {
    Component?: ElementType
    className?: string
    [key: string]: unknown
}

export interface H2Props {
    className?: string
    [key: string]: unknown
}

export interface H3Props {
    className?: string
    [key: string]: unknown
}

export interface H4Props {
    className?: string
    [key: string]: unknown
}

export interface H5Props {
    className?: string
    [key: string]: unknown
}

export interface PProps {
    children?: ReactNode
    [key: string]: unknown
}

export interface LabelProps {
    className?: string
    [key: string]: unknown
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

export interface ThProps {
    children?: ReactNode
    [key: string]: unknown
}

/** Rotated table head, rendered as a child of `Th`. */
export interface TxProps {
    children?: ReactNode
    [key: string]: unknown
}

export interface InlineCodeProps {
    wrap?: boolean
    className?: string
    children?: ReactNode
}

export interface TypeAnnotationProps {
    lang?: CodeLang
    link?: boolean
    children?: ReactNode
}

export interface UlProps {
    children?: ReactNode
    [key: string]: unknown
}

export interface OlProps {
    children?: ReactNode
    [key: string]: unknown
}

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
    items?: NavigationItem[]
    section?: string
    search?: ReactNode
    alert?: ReactNode
    children?: ReactNode
}

export interface SearchProps {
    placeholder?: string
}

/**
 * `seo.js` also declares PropTypes for `meta`, `keywords` and `bodyClass`, but
 * the component never receives them; those stale props are omitted here.
 */
export interface SEOProps {
    description?: string
    title?: string
    section?: string
    sectionTitle?: string
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
    apiDetails?: ApiDetails
    children?: ReactNode
    [key: string]: unknown
}

export interface GitHubCodeProps {
    url: string
    lang?: CodeLang
    errorMsg?: string
    className?: string
}

/** Props for the `Code` component in `code.js` (also `codeBlock.js`/`codeDynamic.js`). */
export interface CodeProps {
    lang?: CodeLang
    title?: string
    /** MDX passes attributes as strings, hence the stringly booleans. */
    executable?: boolean | 'true' | 'false' | null
    github?: string
    prompt?: string
    highlight?: string
    wrap?: boolean
    className?: string
    children?: ReactNode
}

export interface JuniperClassNames {
    cell?: string
    input?: string
    button?: string
    output?: string
}

export interface JuniperProps {
    children?: string
    repo: string
    branch?: string
    url?: string
    serverSettings?: Record<string, unknown>
    kernelType?: string
    lang?: string
    theme?: string
    isolateCells?: boolean
    useBinder?: boolean
    useStorage?: boolean
    storageKey?: string
    storageExpire?: number
    debug?: boolean
    msgButton?: string
    msgLoading?: string
    msgError?: string
    classNames?: JuniperClassNames
}

export interface LandingHeaderProps {
    nightly?: boolean
    legacy?: boolean
    style?: CSSProperties
    children?: ReactNode
}

export interface LandingGridProps {
    cols?: GridCols
    blocks?: boolean
    style?: CSSProperties
    children?: ReactNode
}

export interface LandingCardProps {
    title?: string
    button?: string
    url?: string
    children?: ReactNode
}

export interface LandingButtonProps {
    to?: string
    small?: boolean
    children?: ReactNode
}

export interface LandingDemoProps {
    title?: string
    children?: ReactNode
}

export interface LandingBannerProps {
    title?: string
    label?: string
    to?: string
    button?: string
    small?: boolean
    background?: string
    backgroundImage?: string
    color?: string
    children?: ReactNode
}

/** A single option row within a Quickstart group (e.g. an OS choice). */
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

/** A configurable group of options rendered by the Quickstart widget. */
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
