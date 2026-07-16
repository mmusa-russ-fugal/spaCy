import { ReactNode } from 'react'
import classNames from 'classnames'

import { isString } from './util'
import Icon from './icon'
import classes from '../styles/tag.module.sass'
import type { TagProps } from '../types'

const MIN_VERSION = 3

export default function Tag({ spaced = false, variant, tooltip, children }: TagProps) {
    if (variant === 'new') {
        const isValid = isString(children) && !isNaN(Number(children))
        const version = isValid ? Number(children).toFixed(1) : children
        const tooltipText = `This feature is new and was introduced in spaCy v${version}`
        // We probably want to handle this more elegantly, but the idea is
        // that we can hide tags referring to old versions
        const major = isString(version) ? Number(version.split('.')[0]) : Number(version)
        return major < MIN_VERSION ? null : (
            <TagTemplate spaced={spaced} tooltip={tooltipText}>
                v{version}
            </TagTemplate>
        )
    }
    if (variant === 'model') {
        const tooltipText = `To use this functionality, spaCy needs a trained pipeline that supports the following capabilities: ${children}`
        return (
            <TagTemplate spaced={spaced} tooltip={tooltipText}>
                Needs model
            </TagTemplate>
        )
    }
    return (
        <TagTemplate spaced={spaced} tooltip={tooltip}>
            {children}
        </TagTemplate>
    )
}

const TagTemplate = ({
    spaced,
    tooltip,
    children,
}: {
    spaced?: boolean
    tooltip?: string
    children: ReactNode
}) => {
    const tagClassNames = classNames(classes.root, {
        [classes.spaced]: spaced,
    })
    return (
        <span className={tagClassNames} data-tooltip={tooltip}>
            {children}
            {tooltip && <Icon name="help" width={12} className={classes.icon} />}
        </span>
    )
}
