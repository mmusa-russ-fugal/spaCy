/**
 * Signatures for the free helper functions exported from
 * `website/src/components/util.js`.
 */
import type { ReactNode } from 'react'

/** Build a link to a path within the spaCy GitHub repository. */
export type GithubFn = (filepath?: string, branch?: string) => string

/** Resolve the GitHub source URL for a docs page from its slug. */
export type GetCurrentSourceFn = (slug: string, isIndex?: boolean, branch?: string) => string

/** Type predicate so `isString(x)` narrows `x` to `string` at use sites. */
export type IsStringFn = (obj: unknown) => obj is string
export type IsImageFn = (obj: unknown) => boolean
export type IsEmptyObjFn = (obj: object) => boolean

/** `Array.join` for React nodes: interleaves a delimiter between children. */
export type JoinFn = (children: ReactNode[], delimiter?: string) => ReactNode

/** Index an array of records by one of their string keys. */
export type ArrayToObjFn = <T extends Record<string, unknown>>(
    arr: T[],
    key: string
) => Record<string, T>

/**
 * Abbreviate a large number, e.g. `14249930` -> `14.2m`. Returns the number `0`
 * (not a string) when given `null` or `0` (the implementation explicitly
 * guards `num === null`, so `null` is part of the accepted domain).
 */
export type AbbrNumFn = (num?: number | null, fixed?: number) => string | 0

export type ChunkArrayFn = <T>(arr: T[], chunkSize: number) => T[][]
