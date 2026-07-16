import Code from './codeDynamic'
import classes from '../styles/code.module.sass'
import type { CodeProps, PreProps } from '../types'

export const Pre = (props: PreProps) => {
    return <pre className={classes['pre']}>{props.children}</pre>
}

const CodeBlock = (props: CodeProps) => (
    <Pre>
        <Code {...props} />
    </Pre>
)
export default CodeBlock
