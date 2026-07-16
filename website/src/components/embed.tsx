import { Fragment } from 'react'
import classNames from 'classnames'
import ImageNext from 'next/image'

import Link from './link'
import Button from './button'
import { InlineCode } from './inlineCode'
import MarkdownToReact from './markdownToReactDynamic'

import classes from '../styles/embed.module.sass'
import type {
    EmbedImageProps,
    GoogleSheetProps,
    IframeProps,
    ImageFillProps,
    ImageScrollableProps,
    SoundCloudProps,
    StandaloneProps,
    YouTubeProps,
} from '../types'

const YouTube = ({ id, ratio = '16x9', className }: YouTubeProps) => {
    const embedClassNames = classNames(classes.root, classes.responsive, className, {
        [classes.ratio16x9]: ratio === '16x9',
        [classes.ratio4x3]: ratio === '4x3',
    })
    const url = `https://www.youtube-nocookie.com/embed/${id}`
    return (
        <figure className={embedClassNames}>
            <iframe
                className={classes.iframe}
                title={id}
                src={url}
                frameBorder={0}
                height={500}
                allowFullScreen
            />
        </figure>
    )
}

// React 19 renders the camelCase `frameBorder` prop verbatim, so the original
// lowercase `frameborder` attribute (passed through as an unknown attribute)
// is kept via a spread to stay byte-identical with the previous output.
const legacyFrameBorder = { frameborder: 'no' }

const SoundCloud = ({ id, color = '09a3d5', title }: SoundCloudProps) => {
    const url = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${id}&color=%23${color}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`
    return (
        <figure className={classes.root}>
            <iframe
                title={title}
                width="100%"
                height={166}
                scrolling="no"
                {...legacyFrameBorder}
                allow="autoplay"
                src={url}
            />
        </figure>
    )
}

const Iframe = ({ title, src, width = 800, height = 300 }: IframeProps) => {
    return (
        <iframe
            className={classes.standalone}
            title={title}
            src={src}
            width={width}
            height={height}
            allowFullScreen
            frameBorder="0"
        />
    )
}

const Image = ({ src, alt, title, href, ...props }: EmbedImageProps) => {
    // This is only needed for image types that are NOT handled by
    // gatsby-remark-images, i.e. mostly SVGs. The plugin adds formatting
    // and support for captions, so this normalises that behaviour.
    const linkClassNames = classNames('gatsby-resp-image-link', classes['image-link'])
    const markdownComponents = { code: InlineCode, p: Fragment, a: Link }
    return (
        <figure className="gatsby-resp-image-figure">
            {href ? (
                <Link className={linkClassNames} href={href} noLinkLayout forceExternal>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={classes.image} src={src} alt={alt} width={650} height="auto" />
                </Link>
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className={classes.image} src={src} alt={alt} width={650} height="auto" />
            )}

            {title && (
                <figcaption className="gatsby-resp-image-figcaption">
                    <MarkdownToReact markdown={title} />
                </figcaption>
            )}
        </figure>
    )
}

const ImageScrollable = ({ src, alt, width, ...props }: ImageScrollableProps) => {
    return (
        <figure className={classNames(classes.standalone, classes.scrollable)}>
            <img
                className={classes['image-scrollable']}
                src={src}
                alt={alt}
                width={width}
                height="auto"
            />
        </figure>
    )
}

const Standalone = ({ height, children, ...props }: StandaloneProps) => {
    return (
        <figure className={classes.standalone} style={{ height }}>
            {children}
        </figure>
    )
}

const ImageFill = ({ image, ...props }: ImageFillProps) => {
    return (
        <span
            className={classes['figure-fill']}
            style={{ paddingBottom: `${(image.height / image.width) * 100}%` }}
        >
            <ImageNext src={image.src} {...props} fill />
        </span>
    )
}

const GoogleSheet = ({ id, link, height, button = 'View full table' }: GoogleSheetProps) => {
    return (
        <figure className={classes.root}>
            <iframe
                title={id}
                scrolling="no"
                className={classes['google-sheet']}
                height={height}
                src={`https://docs.google.com/spreadsheets/d/e/${id}/pubhtml?widget=true&amp;headers=false`}
            />
            {link && (
                <Button href={`https://docs.google.com/spreadsheets/d/${link}/view`}>
                    {button}
                </Button>
            )}
        </figure>
    )
}

export { YouTube, SoundCloud, Iframe, Image, ImageFill, ImageScrollable, GoogleSheet, Standalone }
