import { useState, useEffect, useRef } from 'react'
import classNames from 'classnames'

import Link from './link'
import Tag from './tag'
import Dropdown from './dropdown'
import classes from '../styles/sidebar.module.sass'
import type { SidebarProps, SidebarSection } from '../types'

function getActiveHeading(items: SidebarSection[], slug: string | undefined) {
    // `String(slug)` matches the coercion `RegExp.test` always applied here
    if (/^\/?universe/.test(String(slug))) return 'Universe'
    for (let section of items) {
        for (let { isActive, url } of section.items) {
            if (isActive || slug === url) {
                return section.label
            }
        }
    }
    return 'Documentation'
}

const DropdownNavigation = ({
    items,
    defaultValue,
}: {
    items: SidebarSection[]
    defaultValue?: string
}) => {
    return (
        <div className={classes['dropdown']}>
            <Dropdown className={classes['dropdown-select']} defaultValue={defaultValue}>
                <option disabled>Select page...</option>
                {items.map((section, i) =>
                    section.items.map(({ text, url }, j) => (
                        <option value={url} key={j}>
                            {section.label} &rsaquo; {text}
                        </option>
                    ))
                )}
            </Dropdown>
        </div>
    )
}

export default function Sidebar({ items = [], pageMenu = [], slug }: SidebarProps) {
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const activeRef = useRef<HTMLLIElement>(null)
    const activeHeading = getActiveHeading(items, slug)

    useEffect(() => {
        const handleInView = (event: Event) =>
            setActiveSection((event as CustomEvent<string>).detail)
        window.addEventListener('SPACY_SCROLL_HANDLER', handleInView, { passive: true })
        return () => {
            window.removeEventListener('SPACY_SCROLL_HANDLER', handleInView)
        }
    })

    return (
        <menu className={classNames('sidebar', classes['root'])}>
            <h1 hidden aria-hidden="true" className={classNames('h0', classes['active-heading'])}>
                {activeHeading}
            </h1>
            <DropdownNavigation items={items} defaultValue={slug} />
            {items.map((section, i) => (
                <ul className={classes['section']} key={i}>
                    <li className={classes['label']}>{section.label}</li>
                    {section.items.map(({ text, url, tag, onClick, menu, isActive }, j) => {
                        const currentMenu = menu || pageMenu || []
                        const active = isActive || slug === url
                        const itemClassNames = classNames(classes['link'], {
                            [classes['is-active']]: active,
                            'is-active': active,
                        })

                        return (
                            <li key={j} ref={active ? activeRef : null}>
                                <Link
                                    to={url}
                                    onClick={onClick}
                                    className={itemClassNames}
                                    hideIcon
                                >
                                    {text}
                                    {tag && <Tag spaced>{tag}</Tag>}
                                </Link>
                                {active && !!currentMenu.length && (
                                    <ul className={classes['crumbs']}>
                                        {currentMenu.map((crumb) => {
                                            const currentActive = activeSection || currentMenu[0].id
                                            const crumbClassNames = classNames(classes['crumb'], {
                                                [classes['crumb-active']]:
                                                    currentActive === crumb.id,
                                            })
                                            return (
                                                <li className={crumbClassNames} key={crumb.id}>
                                                    <a href={`#${crumb.id}`}>{crumb.text}</a>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </li>
                        )
                    })}
                </ul>
            ))}
        </menu>
    )
}
