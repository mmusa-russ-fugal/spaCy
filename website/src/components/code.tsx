import React, { Fragment, useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import classNames from 'classnames'
import rangeParser from 'parse-numeric-range'
import Prism from 'prismjs'

// We manually load all the languages that are needed, which are currently only those:
import 'prismjs/components/prism-diff.min.js'
import 'prismjs/components/prism-bash.min.js'
import 'prismjs/components/prism-ini.min.js'
import 'prismjs/components/prism-jsx.min.js'
import 'prismjs/components/prism-json.min.js'
import 'prismjs/components/prism-markdown.min.js'
import 'prismjs/components/prism-python.min.js'
import 'prismjs/components/prism-yaml.min.js'
import 'prismjs/components/prism-docker.min.js'
import 'prismjs/components/prism-r.min.js'

import { isString } from './util'
import Link, { OptionalLink } from './link'
import GitHubCode from './github'
import classes from '../styles/code.module.sass'
import siteMetadata from '../../meta/site.json'
import { binderBranch } from '../../meta/dynamicMeta.mjs'
import dynamic from 'next/dynamic'
import type { CodeProps, JuniperProps } from '../types'

const CLI_GROUPS = ['init', 'debug', 'project', 'ray', 'huggingface-hub']

const splitLines = (children: ReactNode) => {
    const listChildrenPerLine: (string | ReactNode[])[] = []

    if (typeof children === 'string') {
        listChildrenPerLine.push(...children.split('\n'))
    } else {
        listChildrenPerLine.push([])
        let indexLine = 0
        if (Array.isArray(children)) {
            children.forEach((child) => {
                if (typeof child === 'string' && child.includes('\n')) {
                    const listString = child.split('\n')
                    listString.forEach((string, index) => {
                        ;(listChildrenPerLine[indexLine] as ReactNode[]).push(string)

                        if (index !== listString.length - 1) {
                            indexLine += 1
                            listChildrenPerLine[indexLine] = []
                        }
                    })
                } else {
                    ;(listChildrenPerLine[indexLine] as ReactNode[]).push(child)
                }
            })
        } else {
            ;(listChildrenPerLine[indexLine] as ReactNode[]).push(children)
            indexLine += 1
            listChildrenPerLine[indexLine] = []
        }
    }

    const listLine = listChildrenPerLine[listChildrenPerLine.length - 1]
    if (listLine === '' || (listLine.length === 1 && listLine[0] === '')) {
        listChildrenPerLine.pop()
    }

    return listChildrenPerLine.map((childrenPerLine, index) => (
        <>
            {childrenPerLine}
            {index !== listChildrenPerLine.length - 1 && '\n'}
        </>
    ))
}

function parseArgs(raw: string) {
    const args = raw.split(' ').filter((arg) => arg)
    const result: Record<string, string | true | null> = {}
    while (args.length) {
        const opt = args.shift() as string
        if (opt.length > 1 && opt.startsWith('-')) {
            const isFlag = !args.length || (args[0].length > 1 && args[0].startsWith('-'))
            result[opt] = isFlag ? true : (args.shift() as string)
        } else {
            let key = opt
            if (CLI_GROUPS.includes(opt)) {
                if (args.length && !args[0].startsWith('-')) {
                    key = `${opt} ${args.shift()}`
                }
            }
            result[key] = null
        }
    }
    return result
}

const flattenReact = (children: ReactNode): string[] => {
    if (children === null || children === undefined || children === false) {
        return []
    }

    if (typeof children === 'string') {
        return [children]
    }

    const element = children as ReactElement<{ children?: ReactNode }>
    if (element.props) {
        return flattenReact(element.props.children)
    }

    return (children as ReactNode[]).flatMap(flattenReact)
}

const checkoutForComment = (line: string) => {
    const lineParts = line.split(' # ')

    if (lineParts.length !== 2) {
        return line
    }

    return (
        <>
            {lineParts[0]}
            {` `}
            <span className="token comment">
                {`# `}
                {lineParts[1]}
            </span>
        </>
    )
}

const handlePromot = ({ lineFlat, prompt }: { lineFlat: string; prompt: string }) => {
    const lineWithoutPrompt = lineFlat.slice(prompt.length + 1)

    const cliRegex = /^python -m spacy/

    if (!cliRegex.test(lineWithoutPrompt)) {
        return <span data-prompt={prompt}>{checkoutForComment(lineWithoutPrompt)}</span>
    }

    const text = lineWithoutPrompt.replace(cliRegex, '')
    const args = parseArgs(text)
    const cmd = Object.keys(args).map((key, i) => {
        const value = args[key]
        return value === null || value === true || i === 0 ? key : `${key} ${value}`
    })
    return (
        <span data-prompt={prompt}>
            <span className={classes['cli-arg-subtle']}>python -m</span> <span>spacy</span>{' '}
            {cmd.map((item, j) => {
                const isCmd = j === 0
                const url = isCmd ? `/api/cli#${item.replace(' ', '-')}` : null
                const isAbstract = isString(item) && /^\[(.+)\]$/.test(item)
                const itemClassNames = classNames(classes['cli-arg'], {
                    [classes['cli-arg-highlight']]: isCmd,
                    [classes['cli-arg-emphasis']]: isAbstract,
                })
                const text = isAbstract ? item.slice(1, -1) : item
                return (
                    <Fragment key={j}>
                        {j !== 0 && ' '}
                        <span className={itemClassNames}>
                            <OptionalLink noLinkLayout hideIcon to={url}>
                                {text}
                            </OptionalLink>
                        </span>
                    </Fragment>
                )
            })}
        </span>
    )
}

const convertLine = ({ line, prompt, lang }: { line: ReactNode; prompt: string; lang: string }) => {
    const lineFlat = flattenReact(line).join('')
    if (lineFlat.startsWith(`${prompt} `)) {
        return handlePromot({ lineFlat, prompt })
    }

    return lang === 'none' || !lineFlat || !(lang in Prism.languages) ? (
        lineFlat
    ) : (
        <span
            dangerouslySetInnerHTML={{
                __html: Prism.highlight(lineFlat, Prism.languages[lang], lang),
            }}
        />
    )
}

const addLineHighlight = (children: ReactNode[], highlight?: string) => {
    if (!highlight) {
        return children
    }
    const listHighlight = rangeParser(highlight)

    if (listHighlight.length === 0) {
        return children
    }

    return children.map((child, index) => {
        const isHighlight = listHighlight.includes(index + 1)
        return (
            <span
                className={classNames({
                    'gatsby-highlight-code-line': isHighlight,
                })}
                key={index}
            >
                {child}
            </span>
        )
    })
}

const CodeHighlighted = ({
    children,
    highlight,
    lang,
}: {
    children?: ReactNode
    highlight?: string
    lang: string
}) => {
    const [html, setHtml] = useState<ReactNode>()

    useEffect(
        () =>
            setHtml(
                addLineHighlight(
                    splitLines(children).map((line) => convertLine({ line, prompt: '$', lang })),
                    highlight
                )
            ),
        [children, highlight, lang]
    )

    return <>{html}</>
}

export default class Code extends React.Component<CodeProps> {
    render() {
        const {
            lang = 'none',
            title,
            executable = null,
            github,
            wrap,
            highlight,
            className,
            children,
        } = this.props
        const codeClassNames = classNames(classes['code'], className, `language-${lang}`, {
            [classes['wrap']]: !!highlight || !!wrap || lang === 'cli',
            [classes['cli']]: lang === 'cli',
        })
        const ghClassNames = classNames(codeClassNames, classes['max-height'])

        if (github) {
            return <GitHubCode url={github} className={ghClassNames} lang={lang} />
        }
        if (!!executable) {
            return (
                <JuniperWrapper title={title} lang={lang}>
                    {children}
                </JuniperWrapper>
            )
        }

        return (
            <>
                {title && <h4 className={classes['title']}>{title}</h4>}
                <code className={codeClassNames}>
                    <CodeHighlighted highlight={highlight} lang={lang}>
                        {children}
                    </CodeHighlighted>
                </code>
            </>
        )
    }
}

// `juniper.js` is intentionally left unconverted (slated for wholesale
// replacement), so the dynamic import is given an explicit boundary type here
// instead of relying on inference across the untyped module.
const JuniperDynamic = dynamic<JuniperProps>(() => import('./juniper'))

const JuniperWrapper = ({
    title,
    lang,
    children,
}: {
    title?: string
    lang?: string
    children?: ReactNode
}) => {
    const { binderUrl, binderVersion } = siteMetadata
    const juniperTitle = title || 'Editable Code'
    return (
        <div className={classes['juniper-wrapper']}>
            <h4 className={classes['juniper-title']}>
                {juniperTitle}
                <span className={classes['juniper-meta']}>
                    spaCy v{binderVersion} &middot; Python 3 &middot; via{' '}
                    <Link to="https://mybinder.org/" noLinkLayout>
                        Binder
                    </Link>
                </span>
            </h4>

            <JuniperDynamic
                repo={binderUrl}
                branch={binderBranch}
                lang={lang}
                classNames={{
                    cell: classes['juniper-cell'],
                    input: classes['juniper-input'],
                    button: classes['juniper-button'],
                    output: classes['juniper-output'],
                }}
            >
                {children}
            </JuniperDynamic>
        </div>
    )
}
