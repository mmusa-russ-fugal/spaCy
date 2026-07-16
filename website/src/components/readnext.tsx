import Icon from './icon'
import Link from './link'
import { Label } from './typography'

import classes from '../styles/readnext.module.sass'
import type { ReadNextProps } from '../types'

export default function ReadNext({ title, to }: ReadNextProps) {
    return (
        <Link to={to} noLinkLayout className={classes.root}>
            <span>
                <Label>Read next</Label>
                {title}
            </span>
            <span className={classes.icon}>
                <Icon name="arrowright" aria-hidden="true" />
            </span>
        </Link>
    )
}
