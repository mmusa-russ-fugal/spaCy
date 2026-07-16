import React, { type ComponentType } from 'react'

import CopyInput from '../components/copy'
import InfoboxUntyped from '../components/infobox'
import Link from '../components/link'
import { InlineCode } from '../components/inlineCode'
import { projectsRepo } from '../components/util'
import type { InfoboxProps, ProjectWidgetProps } from '../types'

// `infobox.js` is not converted yet; its inferred props mark every prop
// required, so type it via the curated props at this boundary.
const Infobox = InfoboxUntyped as ComponentType<InfoboxProps>

const COMMAND = 'python -m spacy project clone'

export default function Project({
    title = 'Get started with a project template',
    id,
    repo,
    children,
}: ProjectWidgetProps) {
    const repoArg = repo ? ` --repo ${repo}` : ''
    const text = `${COMMAND} ${id}${repoArg}`
    const defaultRepo = `https://github.com/${projectsRepo}`
    const url = `${repo || defaultRepo}/${id}`
    const header = (
        <>
            {title}:{' '}
            <Link to={url}>
                <InlineCode>{id}</InlineCode>
            </Link>
        </>
    )
    return (
        <Infobox title={header} emoji="🪐">
            {children}
            <CopyInput
                text={text}
                prefix="$"
                description="Example bash command to start with an end-to-end template"
            />
        </Infobox>
    )
}
