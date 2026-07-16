import { useState, useRef, useEffect } from 'react'
import type { RefObject } from 'react'

import Icon from './icon'
import classes from '../styles/copy.module.sass'
import type { CopyInputProps } from '../types'

export function copyToClipboard(
    ref: RefObject<HTMLTextAreaElement | null>,
    callback: (success: boolean) => void
) {
    const isClient = typeof window !== 'undefined'
    if (ref.current && isClient) {
        ref.current.select()
        document.execCommand('copy')
        callback(true)
        ref.current.blur()
        setTimeout(() => callback(false), 1000)
    }
}

export default function CopyInput({ text, description, prefix }: CopyInputProps) {
    const isClient = typeof window !== 'undefined'
    const [supportsCopy, setSupportsCopy] = useState(false)

    useEffect(() => {
        setSupportsCopy(isClient && document.queryCommandSupported('copy'))
    }, [isClient])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [copySuccess, setCopySuccess] = useState(false)
    const onClick = () => copyToClipboard(textareaRef, setCopySuccess)

    function selectText() {
        if (textareaRef.current && isClient) {
            textareaRef.current.select()
        }
    }

    return (
        <div className={classes.root}>
            {prefix && <span className={classes.prefix}>{prefix}</span>}
            <textarea
                ref={textareaRef}
                readOnly
                className={classes.textarea}
                defaultValue={text}
                rows={1}
                onClick={selectText}
                aria-label={description}
            />
            {supportsCopy && (
                <button title="Copy to clipboard" onClick={onClick}>
                    <Icon width={16} name={copySuccess ? 'accept' : 'clipboard'} />
                </button>
            )}
        </div>
    )
}
