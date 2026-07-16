import { ChangeEvent } from 'react'
import classNames from 'classnames'
import { useRouter } from 'next/router'

import classes from '../styles/dropdown.module.sass'
import type { DropdownProps } from '../types'

export default function Dropdown({ defaultValue, className, onChange, children }: DropdownProps) {
    const router = useRouter()
    const defaultOnChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        const isExternal = /((http(s?)):\/\/|mailto:)/gi.test(target.value)
        if (isExternal) {
            window.location.href = target.value
        } else {
            router.push(target.value)
        }
    }
    return (
        <select
            defaultValue={defaultValue}
            className={classNames(classes.root, className)}
            onChange={onChange || defaultOnChange}
        >
            {children}
        </select>
    )
}
