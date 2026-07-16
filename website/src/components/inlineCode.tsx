import classNames from 'classnames'
import { isString } from './util'
import classes from '../styles/code.module.sass'
import type { InlineCodeProps } from '../types'

const WRAP_THRESHOLD = 30

export const InlineCode = ({ wrap = false, className, children, ...props }: InlineCodeProps) => {
    const codeClassNames = classNames(classes['inline-code'], className, {
        [classes['wrap']]: wrap || (isString(children) && children.length >= WRAP_THRESHOLD),
    })
    return (
        <code className={codeClassNames} {...props}>
            {children}
        </code>
    )
}
