import { Fragment } from 'react'
import classNames from 'classnames'

import Icon from './icon'
import classes from '../styles/infobox.module.sass'
import type { InfoboxProps } from '../types'

export default function Infobox({
    title,
    emoji,
    id,
    variant = 'default',
    list = false,
    className,
    children,
}: InfoboxProps) {
    const Wrapper = id ? 'div' : Fragment
    const infoboxClassNames = classNames(classes.root, className, {
        [classes.list]: !!list,
        [classes.warning]: variant === 'warning',
        [classes.danger]: variant === 'danger',
    })
    return (
        <Wrapper>
            {id && <a id={id} />}
            <aside className={infoboxClassNames}>
                {title && (
                    <h4 className={classes.title}>
                        {variant !== 'default' && !emoji && (
                            <Icon width={18} name={variant} inline className={classes.icon} />
                        )}
                        <span>
                            {emoji && (
                                <span className={classes.emoji} aria-hidden="true">
                                    {emoji}
                                </span>
                            )}
                            {title}
                        </span>
                    </h4>
                )}
                {children}
            </aside>
        </Wrapper>
    )
}
