import classNames from 'classnames'
import ImageNext from 'next/image'

import Link from './link'
import { H5 } from './typography'
import classes from '../styles/card.module.sass'
import type { CardProps } from '../types'

export default function Card({ title, to, image, header, small, onClick, children }: CardProps) {
    return (
        <div className={classNames(classes.root, { [classes.small]: !!small })}>
            {header && (
                <Link to={to} onClick={onClick} noLinkLayout>
                    {header}
                </Link>
            )}
            {(title || image) && (
                <H5 className={classes.title}>
                    {image && (
                        <div className={classes.image}>
                            <ImageNext src={image} height={35} width={35} alt={`${title} Logo`} />
                        </div>
                    )}
                    {title && (
                        <Link to={to} onClick={onClick} noLinkLayout>
                            {title}
                        </Link>
                    )}
                </H5>
            )}
            <Link to={to} onClick={onClick} noLinkLayout>
                {children}
            </Link>
        </div>
    )
}
