import classNames from 'classnames'

import classes from '../styles/grid.module.sass'
import type { GridProps } from '../types'

export default function Grid({
    cols = 1,
    narrow = false,
    gutterBottom = true,
    className,
    style,
    children,
}: GridProps) {
    const gridClassNames = classNames(classes.root, className, {
        [classes.narrow]: narrow,
        [classes.spacing]: gutterBottom,
        [classes.half]: cols === 2,
        [classes.third]: cols === 3,
        [classes.quarter]: cols === 4,
    })
    return (
        <div className={gridClassNames} style={style}>
            {children}
        </div>
    )
}
