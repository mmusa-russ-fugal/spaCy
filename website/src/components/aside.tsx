import classes from '../styles/aside.module.sass'
import type { AsideProps } from '../types'

export default function Aside({ title, children }: AsideProps) {
    return (
        <aside className={classes.root}>
            <div className={classes.content} role="complementary">
                <div className={classes.text}>
                    {title && <h4 className={classes.title}>{title}</h4>}
                    {children}
                </div>
            </div>
        </aside>
    )
}
