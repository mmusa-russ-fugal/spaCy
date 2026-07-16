import React, { useState, useEffect, Fragment, type ComponentType } from 'react'

import Link from '../components/link'
import { InlineCode } from '../components/inlineCode'
import { Label, H3 } from '../components/typography'
import { Table as TableUntyped, Tr, Th, Td as TdUntyped } from '../components/table'
import InfoboxUntyped from '../components/infobox'
import { repo } from '../components/util'
import type { InfoboxProps, TableProps, TdProps } from '../types'

// `table.js` / `infobox.js` are not converted yet; their inferred props mark
// every prop required, so type them via the curated props at this boundary.
const Table = TableUntyped as ComponentType<TableProps>
const Td = TdUntyped as ComponentType<TdProps>
const Infobox = InfoboxUntyped as ComponentType<InfoboxProps>

/** The subset of a GitHub REST release object read by this widget. */
interface GitHubRelease {
    name: string | null
    html_url: string
    published_at: string
    tag_name: string
    prerelease: boolean
}

interface FormattedRelease {
    title: string
    url: string
    date: string
    tag: string
    pre: boolean
}

function formatReleases(json: GitHubRelease[]): FormattedRelease[] {
    return Object.values(json)
        .filter((release): release is GitHubRelease & { name: string } => !!release.name)
        .map((release) => ({
            title:
                release.name.split(': ').length === 2 ? release.name.split(': ')[1] : release.name,
            url: release.html_url,
            date: release.published_at.split('T')[0],
            tag: release.tag_name,
            pre: release.prerelease,
        }))
}

const Changelog = () => {
    const [initialized, setInitialized] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(true)
    const [releases, setReleases] = useState<FormattedRelease[]>([])
    const [prereleases, setPrereleases] = useState<FormattedRelease[]>([])

    useEffect(() => {
        window.dispatchEvent(new Event('resize')) // scroll position for progress
        if (!initialized && repo) {
            setIsError(false)
            setIsLoading(true)
            fetch(`https://api.github.com/repos/${repo}/releases`)
                .then((res) => res.json())
                .then((json) => {
                    const releases = formatReleases(json)
                    setReleases(releases.filter((release) => !release.pre))
                    setPrereleases(releases.filter((release) => release.pre))
                    setIsLoading(false)
                })
                .catch((err) => {
                    setIsLoading(false)
                    setIsError(true)
                    console.error(err)
                })
            setInitialized(true)
        }
    }, [initialized])

    const error = (
        <Infobox title="Unable to load changelog from GitHub" variant="danger">
            <p>
                Please see the
                <Link to={`https://github.com/${repo}/releases`} ws hideIcon>
                    releases page
                </Link>
                instead.
            </p>
        </Infobox>
    )

    return isError ? (
        error
    ) : isLoading ? null : (
        <>
            <H3 id="changelog-stable">Stable Releases</H3>
            <Table>
                <thead>
                    <Tr>
                        <Th>Date</Th>
                        <Th>Version</Th>
                        <Th>Title</Th>
                    </Tr>
                </thead>
                <tbody>
                    {releases.map(({ title, url, date, tag }) => (
                        <Tr key={tag}>
                            <Td nowrap>
                                <Label>{date}</Label>
                            </Td>
                            <Td>
                                <Link to={url} hideIcon>
                                    <InlineCode>{tag}</InlineCode>
                                </Link>
                            </Td>
                            <Td>{title}</Td>
                        </Tr>
                    ))}
                </tbody>
            </Table>

            <H3 id="changelog-pre">Pre-Releases</H3>

            <p>
                Pre-releases include alpha and beta versions, as well as release candidates. They
                are not intended for production use. You can download spaCy pre-releases via the{' '}
                <Link to="https://pypi.org/packages/spacy-nightly">
                    <InlineCode>spacy-nightly</InlineCode>
                </Link>{' '}
                package on pip.
            </p>

            <p>
                {prereleases.map(({ title, date, url, tag }, i) => (
                    <Fragment key={i}>
                        <Link to={url} hideIcon data-tooltip={`${date}: ${title}`}>
                            <InlineCode>{tag}</InlineCode>
                        </Link>{' '}
                    </Fragment>
                ))}
            </p>
        </>
    )
}

export default Changelog
