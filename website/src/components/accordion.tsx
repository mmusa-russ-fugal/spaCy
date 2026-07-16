import { useState, useEffect } from 'react'
import classNames from 'classnames'

import Link from './link'
import classes from '../styles/accordion.module.sass'
import type { AccordionProps } from '../types'

export default function Accordion({
    title,
    id,
    expanded = false,
    spaced = false,
    children,
}: AccordionProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const rootClassNames = classNames(classes.root, {
        [classes.spaced]: !!spaced,
    })
    const contentClassNames = classNames(classes.content, {
        [classes.hidden]: !isExpanded,
    })
    const iconClassNames = classNames({
        [classes.hidden]: isExpanded,
    })
    // Make sure accordion is expanded if JS is disabled
    useEffect(() => setIsExpanded(expanded), [expanded])
    return (
        <section className="accordion" id={id}>
            <div className={rootClassNames}>
                <h4>
                    <button
                        className={classes.button}
                        aria-expanded={isExpanded}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <span>
                            <span className="heading-text">{title}</span>
                            {isExpanded && !!id && (
                                <Link
                                    to={`#${id}`}
                                    className={classes.anchor}
                                    noLinkLayout
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    &para;
                                </Link>
                            )}
                        </span>
                        <svg
                            className={classes.icon}
                            width={20}
                            height={20}
                            viewBox="0 0 10 10"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <rect className={iconClassNames} height={8} width={2} x={4} y={1} />
                            <rect height={2} width={8} x={1} y={4} />
                        </svg>
                    </button>
                </h4>
                <div className={contentClassNames}>{children}</div>
            </div>
        </section>
    )
}
