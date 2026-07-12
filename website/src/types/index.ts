/**
 * Central barrel for the website's TypeScript type definitions, ahead of the
 * planned migration of website/src to .tsx. Nothing in website/src imports
 * from here yet; these types describe existing runtime shapes (props, JSON
 * data, page context) as a reference for converting components one by one.
 */
export * from './common'
export * from './nav'
export * from './site-data'
export * from './page-context'
export * from './components'
export * from './widgets'
export * from './templates'
export * from './util'
export * from './mdx'
