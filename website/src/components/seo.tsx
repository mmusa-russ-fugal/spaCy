import type { MetaHTMLAttributes } from 'react'
import type { StaticImageData } from 'next/image'

import socialImageDefault from '../images/social_default.jpg'
import socialImageApi from '../images/social_api.jpg'
import socialImageUniverse from '../images/social_universe.jpg'
import socialImageNightly from '../images/social_nightly.jpg'
import socialImageLegacy from '../images/social_legacy.jpg'
import siteMetadata from '../../meta/site.json'
import Head from 'next/head'

import { siteUrl } from '../../meta/dynamicMeta.mjs'
import type { SEOProps } from '../types'

function getPageTitle(
    title: string | null | undefined,
    sitename: string,
    slogan: string,
    sectionTitle: string | null | undefined,
    nightly: boolean | undefined,
    legacy: boolean | undefined
) {
    if (sectionTitle && title) {
        const suffix = nightly ? ' (nightly)' : legacy ? ' (legacy)' : ''
        return `${title} · ${sitename} ${sectionTitle}${suffix}`
    }
    if (title) {
        return `${title} · ${sitename}`
    }
    return `${sitename} · ${slogan}`
}

// Pre-existing bug, preserved for output parity: every branch except the
// default returns the imported `StaticImageData` object rather than a URL
// string, which renders as "[object Object]" in the built meta tags.
function getImage(
    section: string | null | undefined,
    nightly: boolean | undefined,
    legacy: boolean | undefined
): string | StaticImageData {
    if (nightly) return socialImageNightly
    if (legacy) return socialImageLegacy
    if (section === 'api') return socialImageApi
    if (section === 'universe') return socialImageUniverse
    return `${siteUrl}${socialImageDefault.src}`
}

export default function SEO({
    description,
    lang = 'en',
    title,
    section,
    sectionTitle,
    nightly,
    legacy,
}: SEOProps) {
    const metaDescription = description || siteMetadata.description
    const pageTitle = getPageTitle(
        title,
        siteMetadata.title,
        siteMetadata.slogan,
        sectionTitle,
        nightly,
        legacy
    )
    const socialImage = getImage(section, nightly, legacy)
    const meta: {
        name?: string
        property?: string
        content: string | StaticImageData | undefined
    }[] = [
        {
            name: 'description',
            content: metaDescription,
        },
        {
            property: 'og:title',
            content: pageTitle,
        },
        {
            property: 'og:description',
            content: metaDescription,
        },
        {
            property: 'og:type',
            content: `website`,
        },
        {
            property: 'og:site_name',
            content: title,
        },
        {
            property: 'og:image',
            content: socialImage,
        },
        {
            name: 'twitter:card',
            content: 'summary_large_image',
        },
        {
            name: 'twitter:image',
            content: socialImage,
        },
        {
            name: 'twitter:creator',
            content: `@${siteMetadata.social.twitter}`,
        },
        {
            name: 'twitter:site',
            content: `@${siteMetadata.social.twitter}`,
        },
        {
            name: 'twitter:title',
            content: pageTitle,
        },
        {
            name: 'twitter:description',
            content: metaDescription,
        },
        {
            name: 'docsearch:language',
            content: lang,
        },
    ]

    return (
        <Head>
            <title>{pageTitle}</title>
            {meta.map((item, index) => (
                // The cast keeps the runtime values (including the
                // StaticImageData `content` noted above) exactly as before.
                <meta key={index} {...(item as MetaHTMLAttributes<HTMLMetaElement>)} />
            ))}
        </Head>
    )
}
