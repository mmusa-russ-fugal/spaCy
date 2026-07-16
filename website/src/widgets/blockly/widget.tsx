/**
 * Chrome for the pipeline builder widget: header with reset button, a
 * workspace slot (children) and the generated-code pane with copy/download
 * actions. The chrome is workspace-agnostic — whatever is rendered into
 * `children` is the editor, and `code` is the generated output to display
 * (already Prism-highlighted as HTML).
 */
import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import classNames from 'classnames'

import Icon from '../../components/icon'
import { copyToClipboard } from '../../components/copy'
import classes from '../../styles/blockly-pipeline.module.sass'

export interface PipelineBuilderWidgetProps {
    title: string
    /** Prism-highlighted HTML of the generated code. */
    code: string
    /** The generated code as plain text (copy/download buffer). */
    rawCode: string
    codeLang?: string
    /** Filename to offer the raw code as a download, if set. */
    download?: string
    /** If set, a header link that opens the current pipeline in the composer. */
    openInComposerHref?: string | null
    onReset?: () => void
    children: ReactNode
}

export default function PipelineBuilderWidget({
    title,
    code,
    rawCode,
    codeLang,
    download,
    openInComposerHref,
    onReset,
    children,
}: PipelineBuilderWidgetProps) {
    const copyAreaRef = useRef<HTMLTextAreaElement>(null)
    const [copySuccess, setCopySuccess] = useState(false)
    const [supportsCopy, setSupportsCopy] = useState(false)
    useEffect(() => {
        setSupportsCopy(typeof document !== 'undefined' && document.queryCommandSupported('copy'))
    }, [])

    const onClickCopy = () => {
        if (!copyAreaRef.current) return
        copyAreaRef.current.value = rawCode
        copyToClipboard(copyAreaRef, setCopySuccess)
    }

    return (
        <div className={classes['root']}>
            <header className={classes['header']}>
                <span className={classes['header-title']}>{title}</span>
                {openInComposerHref && (
                    <a
                        className={classes['reset']}
                        href={openInComposerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open this pipeline in the full Pipeline Composer app"
                    >
                        open in composer ↗
                    </a>
                )}
                {onReset && (
                    <button className={classes['reset']} onClick={onReset}>
                        reset
                    </button>
                )}
            </header>
            {children}
            <pre className={classes['code']}>
                <code
                    className={classNames({ [`language-${codeLang}`]: !!codeLang })}
                    dangerouslySetInnerHTML={{ __html: code }}
                />
                <menu className={classes['menu']}>
                    {supportsCopy && (
                        <button
                            title="Copy to clipboard"
                            onClick={onClickCopy}
                            className={classes['icon-button']}
                        >
                            <Icon width={18} name={copySuccess ? 'accept' : 'clipboard'} />
                        </button>
                    )}
                    {download && (
                        <a
                            href={`data:application/octet-stream,${encodeURIComponent(rawCode)}`}
                            title="Download file"
                            download={download}
                            className={classes['icon-button']}
                        >
                            <Icon width={18} name="download" />
                        </a>
                    )}
                </menu>
            </pre>
            {supportsCopy && (
                <textarea
                    ref={copyAreaRef}
                    className={classes['copy-area']}
                    rows={1}
                    aria-label={`Generated code for ${title}`}
                />
            )}
        </div>
    )
}
