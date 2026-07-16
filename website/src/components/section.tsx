import { useEffect } from 'react'
import classNames from 'classnames'
import { useInView } from 'react-intersection-observer'

import classes from '../styles/section.module.sass'
import type { SectionProps } from '../types'

export default function Section({ id, className, ...props }: SectionProps) {
    const sectionClassNames = classNames(classes.root, className)
    const relId = id && id.startsWith('section-') ? id.slice(8) : id
    const [ref, inView] = useInView({ threshold: 0 })

    useEffect(() => {
        if (inView && relId) {
            window.dispatchEvent(new CustomEvent('SPACY_SCROLL_HANDLER', { detail: relId }))
        }
    }, [inView, relId])
    return <section ref={ref} id={id} className={sectionClassNames} {...props} />
}

export const Hr = () => <hr className={classes.hr} />
