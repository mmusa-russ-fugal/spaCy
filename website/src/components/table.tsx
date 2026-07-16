import classNames from 'classnames'
import type { ReactElement, ReactNode } from 'react'

import { replaceEmoji } from './icon'
import { isString } from './util'
import classes from '../styles/table.module.sass'
import type { TableProps, TdProps, ThProps, TrProps, TxProps } from '../types'

const FOOT_ROW_REGEX = /^(RETURNS|YIELDS|CREATES|PRINTS|EXECUTES|UPLOADS|DOWNLOADS)/

function isNum(children: ReactNode) {
    return isString(children) && /^\d+[.,]?[\dx]+?(|x|ms|mb|gb|k|m)?$/i.test(children)
}

// The row inspectors below duck-type MDX-produced children: rows arrive as
// arrays of `Td` elements, so the casts describe the shapes the original
// untyped property chains already relied on.

function isDividerRow(children: ReactNode): boolean {
    if (!Array.isArray(children)) return false
    const rows = children as ReactElement<{ children?: ReactNode }>[]
    if (rows.length && rows[0].props && (rows[0].type as { name?: string }).name == 'Td') {
        const tdChildren = rows[0].props.children as ReactElement | null | undefined
        if (tdChildren && !Array.isArray(tdChildren) && tdChildren.props) {
            return tdChildren.type === 'em'
        }
    }
    return false
}

function isFootRow(children: ReactNode): boolean {
    if (!Array.isArray(children)) return false
    const rows = children as ReactElement<{ children?: ReactNode }>[]
    if (rows.length && (rows[0].type as { name?: string }).name === 'Td') {
        const cellChildren = rows[0].props.children as
            ReactElement<{ children?: ReactNode }> | null | undefined
        if (
            cellChildren &&
            cellChildren.props &&
            cellChildren.props.children &&
            isString(cellChildren.props.children)
        ) {
            return FOOT_ROW_REGEX.test(cellChildren.props.children)
        }
    }
    return false
}

export const Table = ({ fixed, className, ...props }: TableProps) => {
    const tableClassNames = classNames(classes.root, className, {
        [classes.fixed]: fixed,
    })
    return <table className={tableClassNames} {...props} />
}

export const Th = ({ children, ...props }: ThProps) => {
    const child = children as ReactElement | null | undefined
    const isRotated =
        child && !isString(child) && child.type && (child.type as { name?: string }).name == 'Tx'
    const thClassNames = classNames(classes.th, { [classes['th-rotated']]: isRotated })
    return (
        <th className={thClassNames} {...props}>
            {children}
        </th>
    )
}

// Rotated head, child of Th
export const Tx = ({ children, ...props }: TxProps) => (
    <div className={classes.tx} {...props}>
        <span>{children}</span>
    </div>
)

export const Tr = ({ evenodd = true, children, ...props }: TrProps) => {
    const foot = isFootRow(children)
    const isDivider = isDividerRow(children)
    const trClasssNames = classNames({
        [classes.tr]: evenodd,
        [classes.footer]: foot,
        [classes.divider]: isDivider,
        'table-footer': foot,
    })

    return (
        <tr className={trClasssNames} {...props}>
            {children}
        </tr>
    )
}

export const Td = ({ num, nowrap, className, children, ...props }: TdProps) => {
    const { content } = replaceEmoji(children)
    const tdClassNames = classNames(classes.td, className, {
        [classes.num]: num || isNum(children),
        [classes.nowrap]: nowrap,
    })
    return (
        <td className={tdClassNames} {...props}>
            {content}
        </td>
    )
}
