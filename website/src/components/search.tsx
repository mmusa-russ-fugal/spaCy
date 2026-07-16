import { DocSearch } from '@docsearch/react'
import '@docsearch/css'

import siteMetadata from '../../meta/site.json'
import type { SearchProps } from '../types'

export default function Search({ placeholder = 'Search docs' }: SearchProps) {
    // Inlined at build time; the cast preserves the previous behavior of
    // passing `undefined` through when the variable is not set.
    const apiKey = process.env.DOCSEARCH_API_KEY as string
    const { indexName, appId } = siteMetadata.docSearch
    return (
        <DocSearch appId={appId} indexName={indexName} apiKey={apiKey} placeholder={placeholder} />
    )
}
