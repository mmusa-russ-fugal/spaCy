/**
 * Barrel for the website's TypeScript type definitions, staged ahead of the
 * planned migration of `website/src` to `.tsx`. These types describe the
 * existing runtime shapes (component props, JSON data, per-page context). They
 * are largely a reference for converting components one at a time, though a few
 * (e.g. `ApiDetails`) are already imported directly by converted pages.
 */
export * from './common'
export * from './util'
export * from './nav'
export * from './site-data'
export * from './page-context'
export * from './mdx'
export * from './components'
export * from './widgets'
export * from './templates'
