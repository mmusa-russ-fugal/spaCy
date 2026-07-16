import classNames from 'classnames'

import classes from '../styles/list.module.sass'
import { replaceEmoji } from './icon'
import type { LiProps, OlProps, UlProps } from '../types'

export const Ol = (props: OlProps) => <ol className={classes.ol} {...props} />
export const Ul = (props: UlProps) => <ul className={classes.ul} {...props} />
export const Li = ({ children, emoji, ...props }: LiProps) => {
    const { hasIcon, content } = replaceEmoji(children)
    const liClassNames = classNames(classes.li, {
        [classes['li-icon']]: hasIcon,
        [classes.emoji]: emoji,
    })
    return (
        <li data-emoji={emoji} className={liClassNames} {...props}>
            {content}
        </li>
    )
}
