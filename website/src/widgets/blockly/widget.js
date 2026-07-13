import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Icon from '../../components/icon'
import { copyToClipboard } from '../../components/copy'
import classes from '../../styles/blockly-pipeline.module.sass'

/**
 * Chrome for the pipeline builder widget: header, a workspace slot
 * (children) and the generated-code pane with copy/download actions.
 * The chrome is workspace-agnostic — it wraps the simple DOM workspace
 * today and the Blockly editor later without changes: whatever is
 * rendered into `children` is the editor, and `code` is the generated
 * output to display (already Prism-highlighted as HTML).
 */
export default function PipelineBuilderWidget({
    title,
    code,
    rawCode,
    codeLang,
    download,
    onReset,
    children,
}) {
    const copyAreaRef = useRef()
    const [copySuccess, setCopySuccess] = useState(false)
    const [supportsCopy, setSupportsCopy] = useState(false)
    useEffect(() => {
        setSupportsCopy(typeof document !== 'undefined' && document.queryCommandSupported('copy'))
    }, [])

    const onClickCopy = () => {
        copyAreaRef.current.value = rawCode
        copyToClipboard(copyAreaRef, setCopySuccess)
    }

    return (
        <div className={classes['root']}>
            <header className={classes['header']}>
                <span className={classes['header-title']}>{title}</span>
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

PipelineBuilderWidget.propTypes = {
    title: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    rawCode: PropTypes.string.isRequired,
    codeLang: PropTypes.string,
    download: PropTypes.string,
    onReset: PropTypes.func,
    children: PropTypes.node.isRequired,
}
