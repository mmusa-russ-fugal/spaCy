/**
 * Metadata for the built-in pipeline component factories offered in the
 * builder's toolbox. Mirrors the "Built-in pipeline components" table in
 * /usage/processing-pipelines#built-in. The same records will back the
 * Blockly block definitions (one component block per factory) once the
 * Blockly editor replaces the simple workspace.
 */
export const BUILTIN_COMPONENTS = [
    { name: 'tok2vec', description: 'Token-to-vector embedding layer', url: '/api/tok2vec' },
    { name: 'transformer', description: 'Transformer embedding layer', url: '/api/transformer' },
    { name: 'tagger', description: 'Assign part-of-speech tags', url: '/api/tagger' },
    {
        name: 'morphologizer',
        description: 'Assign morphological features and coarse-grained POS tags',
        url: '/api/morphologizer',
    },
    { name: 'parser', description: 'Assign dependency labels', url: '/api/dependencyparser' },
    { name: 'ner', description: 'Detect and label named entities', url: '/api/entityrecognizer' },
    { name: 'entity_ruler', description: 'Rule-based named entities', url: '/api/entityruler' },
    {
        name: 'entity_linker',
        description: 'Disambiguate entities to IDs',
        url: '/api/entitylinker',
    },
    { name: 'lemmatizer', description: 'Assign base forms', url: '/api/lemmatizer' },
    {
        name: 'attribute_ruler',
        description: 'Rule-based token attributes',
        url: '/api/attributeruler',
    },
    {
        name: 'textcat',
        description: 'Assign exclusive document labels',
        url: '/api/textcategorizer',
    },
    {
        name: 'textcat_multilabel',
        description: 'Assign non-exclusive document labels',
        url: '/api/textcategorizer',
    },
    {
        name: 'spancat',
        description: 'Assign labels to arbitrary spans',
        url: '/api/spancategorizer',
    },
    { name: 'span_ruler', description: 'Rule-based spans', url: '/api/spanruler' },
    {
        name: 'senter',
        description: 'Assign sentence boundaries (trainable)',
        url: '/api/sentencerecognizer',
    },
    { name: 'sentencizer', description: 'Rule-based sentence boundaries', url: '/api/sentencizer' },
]

export const COMPONENT_NAMES = BUILTIN_COMPONENTS.map(({ name }) => name)
