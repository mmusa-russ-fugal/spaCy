import sidebars from './sidebars.json'

const sidebarUsage = sidebars.find((sidebar) => sidebar.section === 'usage')

if (!sidebarUsage) {
    // sidebars.json always defines a "usage" section; the previous untyped
    // code crashed here too (TypeError on `.items`) if it went missing.
    throw new Error('Missing "usage" section in meta/sidebars.json')
}

export const sidebarUsageFlat = sidebarUsage.items.flatMap((item) => item.items)
