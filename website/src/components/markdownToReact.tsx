import { useEffect, useState } from 'react'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { remarkPlugins, rehypePlugins } from '../../plugins/index.mjs'

/**
 * Convert raw Markdown to React
 * @param props.markdown - The Markdown markup to convert.
 * @returns The converted React elements.
 */
export default function MarkdownToReact({ markdown }: { markdown: string }) {
    const [mdx, setMdx] = useState<MDXRemoteSerializeResult | null>(null)

    useEffect(() => {
        const getMdx = async () => {
            setMdx(
                await serialize(markdown, {
                    parseFrontmatter: false,
                    mdxOptions: {
                        remarkPlugins,
                        rehypePlugins,
                    },
                })
            )
        }

        getMdx()
    }, [markdown])

    return mdx ? <MDXRemote {...mdx} /> : <></>
}
