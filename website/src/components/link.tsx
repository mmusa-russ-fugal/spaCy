import { Fragment, ReactNode } from 'react'
import NextLink from 'next/link'
import classNames from 'classnames'

import Icon from './icon'
import classes from '../styles/link.module.sass'
import { isString, isImage } from './util'
import type { IconName, LinkProps, OptionalLinkProps } from '../types'

const listUrlInternal = ['prodi.gy', 'spacy.io', 'explosion.ai']
const Whitespace = ({ children }: { children: ReactNode }) => (
    // Ensure that links are always wrapped in spaces
    <> {children} </>
)

function getIcon(dest: string): IconName | null {
    if (/(github.com)/.test(dest)) return 'code'
    if (/^\/?api\/architectures#/.test(dest)) return 'network'
    if (/^\/?api/.test(dest)) return 'docs'
    if (/^\/?models\/(.+)/.test(dest)) return 'package'
    return null
}

export default function Link({
    children,
    to,
    href,
    onClick,
    noLinkLayout = false,
    hideIcon = false,
    ws = false,
    forceExternal = false,
    className,
    ...other
}: LinkProps) {
    // Every call site passes `to` or `href`; the `''` fallback only satisfies
    // NextLink's required `href` (previously the unreachable no-dest case threw).
    const dest = to || href || ''
    const external = forceExternal || /(http(s?)):\/\//gi.test(dest)
    const icon = getIcon(dest)
    const withIcon = !noLinkLayout && !hideIcon && !!icon && !isImage(children)
    const sourceWithText = withIcon && isString(children)
    const linkClassNames = classNames(classes.root, className, {
        [classes['no-link-layout']]: noLinkLayout,
        [classes.nowrap]: (withIcon && !sourceWithText) || icon === 'network',
        [classes['with-icon']]: withIcon,
    })
    const Wrapper = ws ? Whitespace : Fragment
    const content = (
        <>
            {sourceWithText ? <span className={classes['source-text']}>{children}</span> : children}
            {withIcon && icon && <Icon name={icon} width={16} inline className={classes.icon} />}
        </>
    )

    if (!external) {
        if ((dest && /^#/.test(dest)) || onClick) {
            return (
                <Wrapper>
                    <NextLink href={dest} onClick={onClick} className={linkClassNames}>
                        {children}
                    </NextLink>
                </Wrapper>
            )
        }
        return (
            <Wrapper>
                <NextLink href={dest} className={linkClassNames} {...other}>
                    {content}
                </NextLink>
            </Wrapper>
        )
    }

    const isInternal = listUrlInternal.some((urlInternal) => dest.includes(urlInternal))
    const relTarget = isInternal ? {} : { rel: 'noopener nofollow noreferrer', target: '_blank' }
    return (
        <Wrapper>
            <NextLink href={dest} className={linkClassNames} {...relTarget} {...other}>
                {content}
            </NextLink>
        </Wrapper>
    )
}

export const OptionalLink = ({ to, href, children, ...props }: OptionalLinkProps) => {
    const dest = to || href
    return dest ? (
        <Link to={dest} {...props}>
            {children}
        </Link>
    ) : (
        children || null
    )
}
