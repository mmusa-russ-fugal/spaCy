import { useEffect, useState } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "composer-theme"

/**
 * Resolve the initial theme. Kept in sync with the inline bootstrap script in
 * `index.html`, which applies the same choice before React mounts to avoid a
 * flash of the wrong theme.
 */
function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/**
 * Light/dark theme toggle. Flips the `.dark` class on the document root, which
 * drives all CSS-variable theming (chrome, panels, and syntax-highlight
 * colours) and persists the choice to localStorage.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"))

  return { theme, toggle }
}
