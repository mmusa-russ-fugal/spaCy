import classNames from 'classnames'

import Link from './link'
import Icon from './icon'
import classes from '../styles/button.module.sass'
import type { ButtonProps } from '../types'

export default function Button({
    to,
    variant = 'secondary',
    large = false,
    icon,
    className,
    children,
    ...props
}: ButtonProps) {
    const buttonClassNames = classNames(classes.root, className, {
        [classes.large]: large,
        [classes.primary]: variant === 'primary',
        [classes.secondary]: variant === 'secondary',
        [classes.tertiary]: variant === 'tertiary',
    })
    return (
        <Link to={to} className={buttonClassNames} hideIcon={true} {...props}>
            {icon && <Icon name={icon} width={large ? 16 : 14} inline />}
            {children}
        </Link>
    )
}
