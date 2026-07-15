import { siteUrl } from './meta/dynamicMeta.mjs'

/** @type {import('next-sitemap').IConfig} */
const config = {
    siteUrl,
    generateRobotsTxt: true,
    autoLastmod: false,
    // With `output: 'export'` the site is built straight into `out/`, and the
    // sitemap runs *after* `next build`, so it must write into the published
    // directory (next-sitemap's default is `public/`).
    outDir: 'out',
}

export default config
