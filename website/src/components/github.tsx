import React, { useState, useEffect } from 'react'
import classNames from 'classnames'

import Icon from './icon'
import Link from './link'
import classes from '../styles/code.module.sass'
import Code from './codeDynamic'
import type { GitHubCodeProps } from '../types'

const defaultErrorMsg = `Can't fetch code example from GitHub :(

Please use the link below to view the example. If you've come across
a broken link, we always appreciate a pull request to the repository,
or a report on the issue tracker. Thanks!`

const GitHubCode = ({ url, lang, errorMsg = defaultErrorMsg, className }: GitHubCodeProps) => {
    const [initialized, setInitialized] = useState(false)
    const [code, setCode] = useState<string | null>(errorMsg)
    const codeClassNames = classNames(classes.code, classes['max-height'], className)

    const rawUrl = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob', '')
        .replace('/tree', '')

    useEffect(() => {
        if (!initialized) {
            setCode(null)
            fetch(rawUrl)
                .then((res) => res.text().then((text) => ({ text, ok: res.ok })))
                .then(({ text, ok }) => {
                    setCode(ok ? text : errorMsg)
                })
                .catch((err) => {
                    setCode(errorMsg)
                    console.error(err)
                })
            setInitialized(true)
        }
    }, [initialized, rawUrl, errorMsg])

    return (
        <>
            <header className={classes.header}>
                <Link to={url} noLinkLayout>
                    <Icon name="github" width={16} inline />
                    <code
                        className={classNames(classes['inline-code'], classes['inline-code-dark'])}
                    >
                        {rawUrl.split('.com/')[1]}
                    </code>
                </Link>
            </header>
            {code && (
                <Code className={codeClassNames} lang={lang}>
                    {code}
                </Code>
            )}
        </>
    )
}

export default React.memo(GitHubCode)
