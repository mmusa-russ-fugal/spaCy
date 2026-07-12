/**
 * Function signatures for the free functions exported by website/src/components/util.js.
 */
import type { ReactNode } from 'react'

export type GithubFn = (filepath?: string, branch?: string) => string
export type GetCurrentSourceFn = (slug: string, isIndex?: boolean, branch?: string) => string
export type IsStringFn = (obj: unknown) => boolean
export type IsImageFn = (obj: unknown) => boolean
export type IsEmptyObjFn = (obj: object) => boolean
export type JoinFn = (children: ReactNode[], delimiter?: string) => ReactNode
export type ArrayToObjFn = <T extends Record<string, unknown>>(
    arr: T[],
    key: string
) => Record<string, T>
export type AbbrNumFn = (num?: number | string, fixed?: number) => string
export type ChunkArrayFn = <T>(arr: T[], chunkSize: number) => T[][]
