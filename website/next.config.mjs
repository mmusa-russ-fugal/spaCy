import MDX from '@next/mdx'

import { remarkPlugins, rehypePlugins } from './plugins/index.mjs'

const withMDX = MDX({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins,
        rehypePlugins,
        providerImportSource: '@mdx-js/react',
    },
})

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
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

export default nextConfig
