import React, { Fragment } from 'react'
import siteMetadata from '../../meta/site.json'
import { domain } from '../../meta/dynamicMeta.mjs'
import type {
    AbbrNumFn,
    ArrayToObjFn,
    ChunkArrayFn,
    GetCurrentSourceFn,
    GithubFn,
    IsEmptyObjFn,
    IsImageFn,
    IsStringFn,
    JoinFn,
} from '../types'

const isNightly = siteMetadata.nightlyBranches.includes(domain)
export const DEFAULT_BRANCH = isNightly ? 'develop' : 'master'
export const repo = siteMetadata.repo
export const modelsRepo = siteMetadata.modelsRepo
export const projectsRepo = siteMetadata.projectsRepo

/**
 * This is used to provide selectors for headings so they can be crawled by
 * Algolia's DocSearch
 */
export const headingTextClassName = 'heading-text'

/**
 * Create a link to the spaCy repository on GitHub
 * @param filepath - The file path relative to the root of the repo.
 * @param branch - Optional branch. Defaults to master.
 * @returns URL to the file on GitHub.
 */
export const github: GithubFn = (filepath, branch = DEFAULT_BRANCH) => {
    if (filepath && filepath.startsWith('github.com')) return `https://${filepath}`
    const path = filepath ? '/tree/' + (branch || 'master') + '/' + filepath : ''
    return `https://github.com/${repo}${path}`
}

/**
 * Get the source of a file in the documentation based on its slug
 * @param slug - The slug, e.g. /api/doc.
 * @param isIndex - Whether the page is an index, e.g. /api/index.mdx
 * @param branch - Optional branch on GitHub. Defaults to master.
 */
export const getCurrentSource: GetCurrentSourceFn = (
    slug,
    isIndex = false,
    branch = DEFAULT_BRANCH
) => {
    const ext = isIndex ? '/index.mdx' : '.mdx'
    return github(`website/docs${slug}${ext}`, branch)
}

/**
 * @param obj – The object to check.
 * @returns Whether the object is a string.
 */
export const isString: IsStringFn = (obj): obj is string => {
    return typeof obj === 'string' || obj instanceof String
}

/**
 * @param obj - The object to check.
 * @returns Whether the object is an image
 */
export const isImage: IsImageFn = (obj) => {
    if (!obj || !React.isValidElement<{ name?: unknown; className?: unknown }>(obj)) {
        return false
    }
    return obj.props.name == 'img' || obj.props.className == 'gatsby-resp-image-wrapper'
}

/**
 * @param obj - The object to check.
 * @returns Whether the object is empty.
 */
export const isEmptyObj: IsEmptyObjFn = (obj) => {
    return Object.entries(obj).length === 0 && obj.constructor === Object
}

/**
 * Join an array of nodes with a given string delimiter, like Array.join for React
 * @param arr - The elements to join.
 * @param delimiter - String placed between elements.
 * @returns The joined array.
 */
export const join: JoinFn = (arr, delimiter = ', ') => {
    return arr.map((obj, i) => (
        <Fragment key={i}>
            {obj}
            {i < arr.length - 1 && delimiter}
        </Fragment>
    ))
}

/**
 * Convert an array of objects to an object, using a key with a unique value (ID).
 * e.g. [{id: 'foo', bar: 'baz'}] => {foo: { id: 'foo', bar: 'baz'}}
 * @param arr - The array to convert.
 * @param key - The key value to use to key the dictionary by.
 * @returns The converted object.
 */
export const arrayToObj: ArrayToObjFn = (arr, key) => {
    return Object.assign({}, ...arr.map((item) => ({ [String(item[key])]: item })))
}

/**
 * Abbreviate a number, e.g. 14249930 --> 14.25m.
 * @param num - The number to convert.
 * @param fixed - Number of decimals.
 * @returns The abbreviated number.
 */
export const abbrNum: AbbrNumFn = (num = 0, fixed = 1) => {
    const suffixes = ['', 'k', 'm', 'b', 't']
    if (num === null || num === 0) return 0
    const b = num.toPrecision(2).split('e')
    const k = b.length === 1 ? 0 : Math.floor(Math.min(Number(b[1].slice(1)), 14) / 3)
    const n = k < 1 ? num : num / Math.pow(10, k * 3)
    const c = k >= 1 && n >= 100 ? Math.round(n) : n.toFixed(fixed)
    return (Number(c) < 0 ? c : Math.abs(Number(c))) + suffixes[k]
}

/**
 * Divide an array into chunks
 * @param arr - The array to divide.
 * @param chunkSize - Size of the individual chunks.
 * @returns The divided array.
 */
export const chunkArray: ChunkArrayFn = (arr, chunkSize) => {
    const base = [...arr]
    const result = []
    while (base.length) {
        result.push(base.splice(0, chunkSize))
    }
    return result
}
