/** Serialized-workspace fixtures matching Blockly.serialization.workspaces.save output. */

export const rulerWorkspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        id: "root",
        fields: { LANG: "en", BASE: "blank", MODEL: "" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_sentencizer",
              id: "b1",
              fields: { NAME: "", F_PUNCT_CHARS: "", F_OVERWRITE: false },
              next: {
                block: {
                  type: "spacy_c_entity_ruler",
                  id: "b2",
                  fields: {
                    NAME: "",
                    F_OVERWRITE_ENTS: true,
                    F_PHRASE_MATCHER_ATTR: "LOWER",
                    F_PATTERNS:
                      '{"label": "ORG", "pattern": "Apple"}\n{"label": "GPE", "pattern": [{"LOWER": "u.k."}]}',
                  },
                  next: {
                    block: {
                      type: "spacy_c_merge_entities",
                      id: "b3",
                      fields: { NAME: "" },
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

export const trainableWorkspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        id: "root",
        fields: { LANG: "de", BASE: "blank", MODEL: "" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_tok2vec",
              id: "t1",
              fields: { NAME: "" },
              next: {
                block: {
                  type: "spacy_c_tagger",
                  id: "t2",
                  fields: { NAME: "", F_OVERWRITE: false },
                  next: {
                    block: {
                      type: "spacy_c_ner",
                      id: "t3",
                      fields: { NAME: "my_ner" },
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

export const modelBaseWorkspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        id: "root",
        fields: { LANG: "en", BASE: "model", MODEL: "en_core_web_sm" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_doc_cleaner",
              id: "m1",
              fields: { NAME: "", F_SILENT: true },
            },
          },
        },
      },
    ],
  },
}

export const duplicateWorkspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "spacy_pipeline",
        id: "root",
        fields: { LANG: "en", BASE: "blank", MODEL: "" },
        inputs: {
          COMPONENTS: {
            block: {
              type: "spacy_c_sentencizer",
              id: "d1",
              fields: { NAME: "" },
              next: {
                block: {
                  type: "spacy_c_sentencizer",
                  id: "d2",
                  fields: { NAME: "" },
                },
              },
            },
          },
        },
      },
    ],
  },
}
