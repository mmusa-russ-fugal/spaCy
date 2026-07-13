/**
 * Navigation, sidebar and footer structures shared between `meta/*.json`,
 * the templates, and `components/{navigation,sidebar,footer}.js`.
 */

/** An in-page heading link, rendered as a sidebar sub-item or page menu entry. */
export interface MenuCrumb {
    text: string
    id: string
}

/** A single leaf link inside a sidebar section. */
export interface SidebarLeafItem {
    text: string
    url?: string
    tag?: string
    onClick?: () => void
    menu?: MenuCrumb[]
    isActive?: boolean
}

/** A titled group of leaf links within the sidebar. */
export interface SidebarSection {
    label: string
    items: SidebarLeafItem[]
}

/** One entry of `meta/sidebars.json`: the sidebar for a docs section. */
export interface SidebarConfig {
    section: string
    items: SidebarSection[]
}

/** A top-level navigation link (`meta/site.json` `navigation`). */
export interface NavigationItem {
    text: string
    url: string
}

/** A single link within a footer column. */
export interface FooterLinkItem {
    text: string
    url: string
}

/** A titled column of links in the footer (`meta/site.json` `footer`). */
export interface FooterColumn {
    label: string
    items: FooterLinkItem[]
}
