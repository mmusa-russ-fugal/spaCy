import { useState, useEffect, useRef } from 'react'

import classes from '../styles/progress.module.sass'

function getOffset() {
    // Called during render (initial state), which also runs server-side
    if (typeof document === 'undefined') return { height: 0, vh: 0 }
    const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    )
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    return { height, vh }
}

function getScrollY() {
    // Called during render (initial state), which also runs server-side
    if (typeof window === 'undefined') return 0
    // `scrollTop`/`clientTop` don't exist on `document` (they are element
    // properties) and evaluate to `undefined` at runtime; the cast keeps the
    // long-standing expression (and its NaN fallback below) intact.
    const doc = document as Document & { scrollTop: number; clientTop: number }
    const pos = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
    return isNaN(pos) ? 0 : pos
}

export default function Progress() {
    const progressRef = useRef<HTMLProgressElement>(null)
    const [initialized, setInitialized] = useState(false)
    const [offset, setOffset] = useState(getOffset())
    const [scrollY, setScrollY] = useState(getScrollY())

    function handleScroll() {
        setScrollY(getScrollY())
    }

    function handleResize() {
        setOffset(getOffset())
    }

    useEffect(() => {
        if (!initialized && progressRef.current) {
            handleResize()
            setInitialized(true)
        }
        window.addEventListener('scroll', handleScroll)
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleResize)
        }
    }, [initialized, progressRef])

    const { height, vh } = offset
    const total = 100 - ((height - scrollY - vh) / height) * 100
    const value = scrollY === 0 ? 0 : total || 0
    return <progress ref={progressRef} className={classes.root} value={value} max="100" />
}
