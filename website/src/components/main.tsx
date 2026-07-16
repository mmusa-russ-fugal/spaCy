import classNames from 'classnames'
import type { StaticImageData } from 'next/image'

import patternBlue from '../images/pattern_blue.png'
import patternGreen from '../images/pattern_green.png'
import patternPurple from '../images/pattern_purple.png'
import patternNightly from '../images/pattern_nightly.png'
import patternLegacy from '../images/pattern_legacy.png'
import classes from '../styles/main.module.sass'
import type { ContentProps, MainProps } from '../types'

const patterns: Record<string, StaticImageData> = {
    blue: patternBlue,
    green: patternGreen,
    purple: patternPurple,
    nightly: patternNightly,
    legacy: patternLegacy,
}

export const Content = ({ Component = 'div', className, children }: ContentProps) => (
    <Component className={classNames(classes.content, className)}>{children}</Component>
)

export default function Main({
    sidebar = false,
    asides = false,
    wrapContent = false,
    theme,
    footer,
    children,
}: MainProps) {
    const pattern = patterns[theme ?? 'blue']
    const mainClassNames = classNames(classes.root, {
        [classes['with-sidebar']]: sidebar,
        [classes['with-asides']]: asides,
    })

    return (
        <main className={mainClassNames}>
            {wrapContent ? <Content Component="article">{children}</Content> : children}
            {asides && (
                <div className={classes.asides} style={{ backgroundImage: `url(${pattern.src}` }} />
            )}
            {footer}
        </main>
    )
}
