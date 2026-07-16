/**
 * Minimal ambient declarations for npm packages that ship no TypeScript types.
 * Only the members actually used by `website/src` are declared; extend these
 * (or install the corresponding `@types/*` package) if more surface is needed.
 * (`prismjs` and `html-to-react` live in `modules.d.ts`.)
 */

declare module '@rehooks/online-status' {
    /** React hook: `true` while the browser reports a network connection. */
    export default function useOnlineStatus(): boolean
}
