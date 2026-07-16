import type { GetStaticPaths, GetStaticProps } from 'next'
import { serialize } from 'next-mdx-remote/serialize'
import fs from 'fs'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import path from 'path'
import Layout from '../src/templates'
import { remarkPlugins, rehypePlugins } from '../plugins/index.mjs'

import recordSection from '../meta/recordSections'
import { sidebarUsageFlat } from '../meta/sidebarFlat'
import type { ApiDetails } from '../src/types/page-context'

export type PropsPageBase = {
    /**
     * TODO: This is only here for legacy support of the old code base
     * It should be refactort to pass the file path and page path instead.
     */
    slug: string
    sectionTitle: string | null
    theme: string | null
    section: string
    isIndex: boolean
}

export type PropsPage = PropsPageBase & {
    mdx: MDXRemoteSerializeResult
    apiDetails: ApiDetails
}

const PostPage = ({ mdx: mdx, ...props }: PropsPage) => {
    return (
        <Layout {...props}>
            <MDXRemote {...mdx} />
        </Layout>
    )
}

export default PostPage

type ParsedUrlQuery = {
    listPathPage: Array<string>
}

/**
 * next-mdx-remote v5 types frontmatter as Record<string, unknown>;
 * type the fields this page actually reads. Most of these keys are
 * string-valued in the website/docs YAML frontmatter, but
 * `api_trainable` is a YAML boolean (e.g. `api_trainable: true`).
 */
type PageFrontmatter = {
    title: string
    section?: string
    api_string_name?: string
    api_base_class?: string
    api_trainable?: boolean
}

export const getStaticPaths: GetStaticPaths<ParsedUrlQuery> = async () => {
    // This function needs to be defined inside `getStaticPath` to be executed in executed in the correct context
    const loadFolder = (pathBase: Array<string> = []): Array<{ params: ParsedUrlQuery }> =>
        fs
            .readdirSync(path.join('docs', ...pathBase), { withFileTypes: true })
            .flatMap((dirent: fs.Dirent) => {
                if (dirent.isDirectory()) {
                    return loadFolder([...pathBase, dirent.name])
                }
                if (!dirent.name.includes('.mdx') || dirent.name[0] === '_') {
                    return []
                }

                return {
                    params: {
                        listPathPage:
                            dirent.name === 'index.mdx'
                                ? pathBase
                                : [...pathBase, dirent.name.replace('.mdx', '')],
                    },
                }
            })

    return {
        paths: loadFolder(),
        fallback: false,
    }
}

const getPathFileWithExtension = (listPathFile: ReadonlyArray<string>) =>
    `${path.join(...listPathFile)}.mdx`

export const getStaticProps: GetStaticProps<PropsPage, ParsedUrlQuery> = async (args) => {
    if (!args.params) {
        return { notFound: true }
    }

    const listPathFile = ['docs', ...args.params.listPathPage]
    const isIndex = fs.existsSync(getPathFileWithExtension(listPathFile)) !== true
    const listPathFileWithIndex = isIndex ? [...listPathFile, 'index'] : listPathFile
    const pathFileWithIndexAndExtension = getPathFileWithExtension(listPathFileWithIndex)

    const mdx = await serialize<Record<string, unknown>, PageFrontmatter>(
        fs.readFileSync(pathFileWithIndexAndExtension, 'utf-8'),
        {
            parseFrontmatter: true,
            mdxOptions: { remarkPlugins, rehypePlugins },
        }
    )

    if (!mdx.frontmatter) {
        throw new Error(`Frontmatter missing for ${pathFileWithIndexAndExtension}`)
    }

    const parentFolder =
        listPathFileWithIndex.length > 1
            ? listPathFileWithIndex[listPathFileWithIndex.length - 2]
            : null
    const section = mdx.frontmatter.section ?? parentFolder
    const sectionMeta = section ? recordSection[section] ?? null : null
    const baseClass = null
    const apiDetails: ApiDetails = {
        stringName: mdx.frontmatter.api_string_name ?? null,
        baseClass: baseClass
            ? {
                  title: mdx.frontmatter.title,
                  slug: mdx.frontmatter.api_base_class,
              }
            : null,
        trainable: mdx.frontmatter.api_trainable ?? null,
    }

    const slug = `/${args.params.listPathPage.join('/')}`

    const next =
        section === 'usage'
            ? sidebarUsageFlat.find((item, index) => {
                  return (
                      index > 0 && sidebarUsageFlat[index - 1].url === slug && item.url[0] === '/'
                  )
              })
            : undefined

    return {
        props: {
            ...mdx.frontmatter,
            slug,
            mdx,
            sectionTitle: sectionMeta?.title ?? null,
            theme: sectionMeta?.theme ?? null,
            section: section,
            apiDetails: apiDetails,
            isIndex,
            next: next
                ? {
                      slug: next.url,
                      title: next.text,
                  }
                : null,
        },
    }
}
