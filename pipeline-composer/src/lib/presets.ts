export interface Preset {
  id: string
  label: string
  description: string
  workspace: unknown
}

const rulerDemo = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        x: 24,
        y: 24,
        fields: { LANG: "en", BASE: "blank", MODEL: "en_core_web_sm" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_sentencizer",
              fields: { NAME: "" },
              next: {
                block: {
                  type: "spacy_c_entity_ruler",
                  fields: {
                    NAME: "",
                    F_OVERWRITE_ENTS: false,
                    F_PHRASE_MATCHER_ATTR: "LOWER",
                    F_PATTERNS: [
                      '{"label": "ORG", "pattern": "Apple"}',
                      '{"label": "GPE", "pattern": [{"LOWER": "u.k."}]}',
                      '{"label": "MONEY", "pattern": [{"LIKE_NUM": true}, {"LOWER": "billion"}]}',
                    ].join("\n"),
                  },
                  next: {
                    block: { type: "spacy_c_merge_entities", fields: { NAME: "" } },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
}

const trainedExtras = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        x: 24,
        y: 24,
        fields: { LANG: "en", BASE: "model", MODEL: "en_core_web_sm" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_span_ruler",
              fields: {
                NAME: "",
                F_SPANS_KEY: "ruler",
                F_ANNOTATE_ENTS: false,
                F_PATTERNS: '{"label": "TECH", "pattern": [{"LOWER": "startup"}]}',
              },
              next: {
                block: { type: "spacy_c_doc_cleaner", fields: { NAME: "", F_SILENT: true } },
              },
            },
          },
        },
      },
    ],
  },
}

const trainableSkeleton = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        x: 24,
        y: 24,
        fields: { LANG: "en", BASE: "blank", MODEL: "en_core_web_sm" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_tok2vec",
              fields: { NAME: "" },
              next: {
                block: {
                  type: "spacy_c_tagger",
                  fields: { NAME: "", F_OVERWRITE: false },
                  next: {
                    block: {
                      type: "spacy_c_parser",
                      fields: { NAME: "" },
                      next: {
                        block: { type: "spacy_c_ner", fields: { NAME: "" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
}

export const presets: Preset[] = [
  {
    id: "ruler-demo",
    label: "Rule-based NER demo",
    description:
      "Blank English + sentencizer + entity ruler with patterns + merge entities. Runs everywhere, including in-browser.",
    workspace: rulerDemo,
  },
  {
    id: "trained-extras",
    label: "Trained model + extras",
    description:
      "en_core_web_sm plus a span ruler and doc cleaner. Requires the local run server with the model installed.",
    workspace: trainedExtras,
  },
  {
    id: "trainable-skeleton",
    label: "Blank trainable skeleton",
    description:
      "tok2vec + tagger + parser + ner on a blank base — the classic training setup. Export the config.cfg to train it.",
    workspace: trainableSkeleton,
  },
]
