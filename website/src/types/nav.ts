/**
 * Types describing navigation, sidebar and footer data structures shared
 * between meta/*.json, templates, and components/{navigation,sidebar,footer}.js.
 */

/** An in-page heading crumb, e.g. rendered as sidebar sub-items or a page menu. */
export interface MenuCrumb {
    text: string
    id: string
}

/** A single leaf link within a sidebar section. */
export interface SidebarLeafItem {
    text: string
    url?: string
    tag?: string
    onClick?: () => void
    menu?: MenuCrumb[]
    isActive?: boolean
}

/** A labeled group of links shown in the sidebar (and as an optgroup in the mobile dropdown). */
export interface SidebarSection {
    label: string
    items: SidebarLeafItem[]
}

/** Shape of an entry in meta/sidebars.json. */
export interface SidebarConfig {
    section: string
    items: SidebarSection[]
}

/** A single top-level navigation link, e.g. from meta/site.json `navigation`. */
export interface NavigationItem {
    text: string
    url: string
}

/** A single link within a footer column. */
export interface FooterLinkItem {
    text: string
    url: string
}

/** A labeled column of links in the site footer, e.g. from meta/site.json `footer`. */
export interface FooterColumn {
    label: string
    items: FooterLinkItem[]
}
