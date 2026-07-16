/**
 * Minimal ambient declarations for npm packages that ship no TypeScript types.
 * Only the members actually used by `website/src` are declared; extend these
 * (or install the corresponding `@types/*` package) if more surface is needed.
 */

declare module 'prismjs' {
    /** A Prism grammar definition (token name -> pattern config). */
    type Grammar = Record<string, unknown>
    const Prism: {
        /** Registered grammars, keyed by language id (e.g. `ini`). */
        languages: Record<string, Grammar>
        /** Highlight `text` and return the HTML string. */
        highlight(text: string, grammar: Grammar, language: string): string
    }
    export default Prism
}

declare module '@rehooks/online-status' {
    /** React hook: `true` while the browser reports a network connection. */
    export default function useOnlineStatus(): boolean
}
