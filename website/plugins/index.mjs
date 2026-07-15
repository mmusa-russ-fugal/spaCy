import remarkGfm from 'remark-gfm'
import remarkSmartypants from 'remark-smartypants'
import rehypeUnwrapImages from 'rehype-unwrap-images'

import remarkCustomAttrs from './remarkCustomAttrs.mjs'
import remarkWrapSections from './remarkWrapSections.mjs'
import remarkCodeBlocks from './remarkCodeBlocks.mjs'
import remarkFindAndReplace from './remarkFindAndReplace.mjs'

export const remarkPlugins = [
    remarkGfm,
    remarkSmartypants,
    remarkFindAndReplace,
    remarkCustomAttrs,
    remarkCodeBlocks,
    remarkWrapSections,
]

export const rehypePlugins = [rehypeUnwrapImages]

export default remarkPlugins
