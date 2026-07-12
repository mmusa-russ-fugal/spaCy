import factoryMetaJson from "@/generated/factory-meta.json"

/** FactoryMeta dumped from spaCy by scripts/generate_component_meta.py. */
export interface FactoryMeta {
  name: string
  requires: string[]
  assigns: string[]
  retokenizes: boolean
  defaultConfig: Record<string, unknown>
}

export const SPACY_META_VERSION: string = factoryMetaJson.spacyVersion

export const factoryMeta: Record<string, FactoryMeta> = Object.fromEntries(
  (factoryMetaJson.factories as FactoryMeta[]).map((f) => [f.name, f])
)

export type FieldWidget = "checkbox" | "number" | "text" | "dropdown" | "multiline"

export interface FieldDef {
  /** Config key this field maps to, or "patterns" for ruler pattern JSONL. */
  key: string
  label: string
  widget: FieldWidget
  /** Dropdown options as [label, value]; value "__default__" means "leave unset". */
  options?: [string, string][]
  /** Treat the raw text as JSONL ruler patterns instead of a config value. */
  isPatterns?: boolean
  /** Convert the raw field value into the config value (e.g. CSV -> list). */
  toConfig?: (raw: string) => unknown
  precision?: number
  min?: number
}

export type Category = "trainable" | "rulebased" | "utility"

export interface ComponentDef {
  factory: string
  label: string
  description: string
  category: Category
  /** Needs training before it produces output; warns when used on a blank base. */
  trainable: boolean
  fields: FieldDef[]
}

const csvToChars = (raw: string): unknown => {
  const chars = raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
  return chars.length ? chars : undefined
}

/**
 * UI overlay for the core built-in components. Every entry must have a
 * matching factory in factory-meta.json — the vitest drift check enforces it.
 */
export const catalog: ComponentDef[] = [
  {
    factory: "tok2vec",
    label: "tok2vec",
    description: "Token-to-vector embedding layer shared by trainable components.",
    category: "trainable",
    trainable: true,
    fields: [],
  },
  {
    factory: "tagger",
    label: "Tagger",
    description: "Predicts fine-grained part-of-speech tags (token.tag).",
    category: "trainable",
    trainable: true,
    fields: [{ key: "overwrite", label: "overwrite", widget: "checkbox" }],
  },
  {
    factory: "morphologizer",
    label: "Morphologizer",
    description: "Predicts morphological features and coarse POS (token.morph, token.pos).",
    category: "trainable",
    trainable: true,
    fields: [{ key: "overwrite", label: "overwrite", widget: "checkbox" }],
  },
  {
    factory: "parser",
    label: "Dependency Parser",
    description: "Predicts syntactic dependencies and sentence boundaries.",
    category: "trainable",
    trainable: true,
    fields: [],
  },
  {
    factory: "ner",
    label: "Named Entity Recognizer",
    description: "Predicts named entities as doc.ents.",
    category: "trainable",
    trainable: true,
    fields: [],
  },
  {
    factory: "senter",
    label: "Sentence Recognizer",
    description: "Trainable, lightweight sentence-boundary detector.",
    category: "trainable",
    trainable: true,
    fields: [{ key: "overwrite", label: "overwrite", widget: "checkbox" }],
  },
  {
    factory: "trainable_lemmatizer",
    label: "Trainable Lemmatizer",
    description: "Edit-tree lemmatizer learned from data (token.lemma).",
    category: "trainable",
    trainable: true,
    fields: [
      { key: "top_k", label: "top k", widget: "number", precision: 1, min: 1 },
    ],
  },
  {
    factory: "textcat",
    label: "Text Classifier",
    description: "Single-label text classification (doc.cats).",
    category: "trainable",
    trainable: true,
    fields: [
      { key: "threshold", label: "threshold", widget: "number", min: 0 },
    ],
  },
  {
    factory: "textcat_multilabel",
    label: "Multilabel Text Classifier",
    description: "Multi-label text classification (doc.cats).",
    category: "trainable",
    trainable: true,
    fields: [
      { key: "threshold", label: "threshold", widget: "number", min: 0 },
    ],
  },
  {
    factory: "spancat",
    label: "Span Categorizer",
    description: "Predicts labeled, possibly overlapping spans (doc.spans).",
    category: "trainable",
    trainable: true,
    fields: [
      { key: "spans_key", label: "spans key", widget: "text" },
      { key: "threshold", label: "threshold", widget: "number", min: 0 },
    ],
  },
  {
    factory: "sentencizer",
    label: "Sentencizer",
    description: "Rule-based sentence segmentation from punctuation.",
    category: "rulebased",
    trainable: false,
    fields: [
      {
        key: "punct_chars",
        label: "punct chars (comma-sep)",
        widget: "text",
        toConfig: csvToChars,
      },
      { key: "overwrite", label: "overwrite", widget: "checkbox" },
    ],
  },
  {
    factory: "lemmatizer",
    label: "Lemmatizer",
    description: "Rule- or lookup-based lemmatization (token.lemma).",
    category: "rulebased",
    trainable: false,
    fields: [
      {
        key: "mode",
        label: "mode",
        widget: "dropdown",
        options: [
          ["lookup", "lookup"],
          ["rule", "rule"],
        ],
      },
      { key: "overwrite", label: "overwrite", widget: "checkbox" },
    ],
  },
  {
    factory: "attribute_ruler",
    label: "Attribute Ruler",
    description: "Sets token attributes from matcher rules (used for tag maps).",
    category: "rulebased",
    trainable: false,
    fields: [],
  },
  {
    factory: "entity_ruler",
    label: "Entity Ruler",
    description: "Adds entities from phrase/token patterns (doc.ents).",
    category: "rulebased",
    trainable: false,
    fields: [
      { key: "overwrite_ents", label: "overwrite ents", widget: "checkbox" },
      {
        key: "phrase_matcher_attr",
        label: "match on",
        widget: "dropdown",
        options: [
          ["exact text", "__default__"],
          ["LOWER", "LOWER"],
          ["ORTH", "ORTH"],
        ],
      },
      {
        key: "patterns",
        label: "patterns (JSONL)",
        widget: "multiline",
        isPatterns: true,
      },
    ],
  },
  {
    factory: "span_ruler",
    label: "Span Ruler",
    description: "Adds spans (or entities) from patterns (doc.spans).",
    category: "rulebased",
    trainable: false,
    fields: [
      { key: "spans_key", label: "spans key", widget: "text" },
      { key: "annotate_ents", label: "annotate ents", widget: "checkbox" },
      {
        key: "patterns",
        label: "patterns (JSONL)",
        widget: "multiline",
        isPatterns: true,
      },
    ],
  },
  {
    factory: "merge_entities",
    label: "Merge Entities",
    description: "Merges each entity into a single token (retokenizes).",
    category: "utility",
    trainable: false,
    fields: [],
  },
  {
    factory: "merge_noun_chunks",
    label: "Merge Noun Chunks",
    description: "Merges each noun chunk into a single token (retokenizes).",
    category: "utility",
    trainable: false,
    fields: [],
  },
  {
    factory: "token_splitter",
    label: "Token Splitter",
    description: "Splits very long tokens into shorter pieces.",
    category: "utility",
    trainable: false,
    fields: [
      { key: "min_length", label: "min length", widget: "number", precision: 1, min: 1 },
      { key: "split_length", label: "split length", widget: "number", precision: 1, min: 1 },
    ],
  },
  {
    factory: "doc_cleaner",
    label: "Doc Cleaner",
    description: "Removes intermediate data (e.g. tensors) from finished docs.",
    category: "utility",
    trainable: false,
    fields: [{ key: "silent", label: "silent", widget: "checkbox" }],
  },
]

export const catalogByFactory: Record<string, ComponentDef> = Object.fromEntries(
  catalog.map((c) => [c.factory, c])
)

export interface LanguageDef {
  code: string
  label: string
  /** Whether the blank tokenizer works in the Pyodide engine (pure Python). */
  pyodideOk: boolean
}

export const languages: LanguageDef[] = [
  { code: "en", label: "English", pyodideOk: true },
  { code: "de", label: "German", pyodideOk: true },
  { code: "fr", label: "French", pyodideOk: true },
  { code: "es", label: "Spanish", pyodideOk: true },
  { code: "pt", label: "Portuguese", pyodideOk: true },
  { code: "it", label: "Italian", pyodideOk: true },
  { code: "nl", label: "Dutch", pyodideOk: true },
  { code: "sv", label: "Swedish", pyodideOk: true },
  { code: "da", label: "Danish", pyodideOk: true },
  { code: "nb", label: "Norwegian Bokmål", pyodideOk: true },
  { code: "fi", label: "Finnish", pyodideOk: true },
  { code: "pl", label: "Polish", pyodideOk: true },
  { code: "ro", label: "Romanian", pyodideOk: true },
  { code: "el", label: "Greek", pyodideOk: true },
  { code: "ru", label: "Russian", pyodideOk: true },
  { code: "uk", label: "Ukrainian", pyodideOk: true },
  { code: "tr", label: "Turkish", pyodideOk: true },
  { code: "ca", label: "Catalan", pyodideOk: true },
  { code: "zh", label: "Chinese (char)", pyodideOk: true },
  { code: "ja", label: "Japanese", pyodideOk: false },
  { code: "ko", label: "Korean", pyodideOk: false },
  { code: "th", label: "Thai", pyodideOk: false },
  { code: "xx", label: "Multi-language", pyodideOk: true },
]
