/**
 * Explicit factory -> spaCy docs URL map, ported from
 * `pipeline-composer/src/blockly/helpUrls.ts`. The docs slugs do not follow a
 * mechanical transform of the factory name (e.g. `ner` lives at
 * /api/entityrecognizer, and the merge/utility pipes are anchors on the
 * pipeline-functions page), so they are listed here verbatim, verified against
 * website/docs/api/*.mdx.
 *
 * Adapted for the docs site: URLs are site-relative (`/api/...`) instead of
 * absolute `https://spacy.io/...` so block help links stay on the current
 * host (previews, local builds).
 */
const API_BASE = '/api/'

/** Factory -> docs page slug (own page under /api/<slug>). */
const PAGE_SLUG: Record<string, string> = {
    tok2vec: 'tok2vec',
    tagger: 'tagger',
    morphologizer: 'morphologizer',
    parser: 'dependencyparser',
    ner: 'entityrecognizer',
    senter: 'sentencerecognizer',
    trainable_lemmatizer: 'edittreelemmatizer',
    textcat: 'textcategorizer',
    textcat_multilabel: 'textcategorizer',
    spancat: 'spancategorizer',
    sentencizer: 'sentencizer',
    lemmatizer: 'lemmatizer',
    attribute_ruler: 'attributeruler',
    entity_ruler: 'entityruler',
    span_ruler: 'spanruler',
}

/** Factory -> anchor on the /api/pipeline-functions page (no own page). */
const PIPELINE_FUNCTION_ANCHORS = new Set([
    'merge_entities',
    'merge_noun_chunks',
    'token_splitter',
    'doc_cleaner',
])

export function helpUrlFor(factory: string): string {
    if (PIPELINE_FUNCTION_ANCHORS.has(factory)) {
        return `${API_BASE}pipeline-functions#${factory}`
    }
    const slug = PAGE_SLUG[factory]
    return slug ? `${API_BASE}${slug}` : `${API_BASE}${factory.replace(/_/g, '-')}`
}
