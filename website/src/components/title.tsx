import type { ReactNode } from 'react'
import classNames from 'classnames'

import Button from './button'
import Tag from './tag'
import { OptionalLink } from './link'
import { InlineCode } from './inlineCode'
import { H1, Label, InlineList, Help } from './typography'
import Icon from './icon'

import classes from '../styles/title.module.sass'
import Image from 'next/image'
import type { ApiDetails, TitleProps } from '../types'

const MetaItem = ({
    label,
    url,
    children,
    help,
}: {
    label: string
    url?: string
    children?: ReactNode
    help?: string
}) => (
    <span>
        <Label className={classes.label}>{label}:</Label>
        <OptionalLink to={url}>{children}</OptionalLink>
        {help && (
            <>
                {' '}
                <Help>{help}</Help>
            </>
        )}
    </span>
)

export default function Title({
    id,
    title,
    tag,
    version,
    teaser,
    source,
    image,
    apiDetails,
    children,
    ...props
}: TitleProps) {
    const details: Partial<ApiDetails> = apiDetails || {}
    const hasApiDetails = Object.values(details).some((v) => v)
    const metaIconProps = { className: classes['meta-icon'], width: 18 }
    return (
        <header className={classes.root}>
            {(image || source) && (
                <div className={classes.corner}>
                    {source && (
                        <Button to={source} icon="code">
                            Source
                        </Button>
                    )}

                    {image && (
                        <div className={classes.image}>
                            <Image src={image} width={100} height={100} alt={`${title} Logo`} />
                        </div>
                    )}
                </div>
            )}
            <H1 className={classes.h1} id={id} {...props}>
                {title}
            </H1>
            {(tag || version) && (
                <div className={classes.tags}>
                    {tag && <Tag spaced>{tag}</Tag>}
                    {version && (
                        <Tag variant="new" spaced>
                            {version}
                        </Tag>
                    )}
                </div>
            )}

            {hasApiDetails && (
                <InlineList Component="div" className={classes.teaser}>
                    {details.stringName && (
                        <MetaItem
                            label="String name"
                            //help="String name of the component to use with nlp.add_pipe"
                        >
                            <InlineCode>{details.stringName}</InlineCode>
                        </MetaItem>
                    )}
                    {details.baseClass && (
                        <MetaItem label="Base class" url={details.baseClass.slug}>
                            <InlineCode>{details.baseClass.title}</InlineCode>
                        </MetaItem>
                    )}
                    {details.trainable != null && (
                        <MetaItem label="Trainable">
                            <span aria-label={details.trainable ? 'yes' : 'no'}>
                                {details.trainable ? (
                                    <Icon name="yes" variant="success" {...metaIconProps} />
                                ) : (
                                    <Icon name="no" {...metaIconProps} />
                                )}
                            </span>
                        </MetaItem>
                    )}
                </InlineList>
            )}
            {teaser && <div className={classNames('heading-teaser', classes.teaser)}>{teaser}</div>}
            {children}
        </header>
    )
}
