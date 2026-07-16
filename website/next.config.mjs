import MDX from '@next/mdx'
import withSerwistInit from '@serwist/next'

import { remarkPlugins, rehypePlugins } from './plugins/index.mjs'

const withMDX = MDX({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins,
        rehypePlugins,
        providerImportSource: '@mdx-js/react',
    },
})

// PWA seam (swappable): @serwist/next compiles src/sw.ts into public/sw.js
// during `next build` (webpack builds only — see the --webpack scripts) and
// injects the precache manifest. Disabled in dev: no service worker is
// emitted or registered. To replace the PWA implementation, swap this
// wrapper and src/sw.ts — nothing else depends on Serwist.
const withSerwist = withSerwistInit({
    swSrc: 'src/sw.ts',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = withSerwist(
    withMDX({
        output: 'export',
        reactStrictMode: true,
        pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
        typescript: {
            ignoreBuildErrors: true,
        },
        images: { unoptimized: true },
        env: {
            DOCSEARCH_API_KEY: process.env.DOCSEARCH_API_KEY,
        },
    })
)

export default nextConfig
