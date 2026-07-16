import { useState } from 'react'
import classNames from 'classnames'

import Icon from './icon'
import classes from '../styles/alert.module.sass'
import type { AlertProps } from '../types'

export default function Alert({ title, icon, variant, closeOnClick = true, children }: AlertProps) {
    const [visible, setVisible] = useState(true)
    const alertClassNames = classNames(classes.root, {
        [classes.warning]: variant === 'warning',
        [classes.clickable]: !!closeOnClick,
    })
    const handleClick = () => !!closeOnClick && setVisible(false)
    return !visible ? null : (
        <aside className={alertClassNames} role="alert" onClick={handleClick}>
            {icon && <Icon name={icon} width={18} inline />}
            {title && <strong>{title}</strong>} {children}
        </aside>
    )
}
