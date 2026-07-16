/**
 * Ambient declarations for untyped third-party modules used by
 * `website/src/components/`. Neither `prismjs` nor `html-to-react` ships type
 * definitions, and pulling in `@types/*` packages would churn the lockfile for
 * the handful of members actually used — so the consumed surface is declared
 * here instead.
 */

declare module 'prismjs' {
    /** A Prism language grammar (opaque here — only passed back into `highlight`). */
    type Grammar = unknown

    const Prism: {
        /** Registered grammars, keyed by language id (populated by the component imports). */
        languages: Record<string, Grammar>
        highlight(text: string, grammar: Grammar, language: string): string
    }
    export default Prism
}

/** Side-effect-only grammar registrations, e.g. `prismjs/components/prism-python.min.js`. */
declare module 'prismjs/components/*'

declare module 'html-to-react' {
    import type { ReactElement } from 'react'

    export class Parser {
        parse(html: string): ReactElement
    }
}
