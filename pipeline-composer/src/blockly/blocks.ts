import * as Blockly from "blockly/core"
import { FieldMultilineInput } from "@blockly/field-multilineinput"

import {
  catalog,
  factoryMeta,
  languages,
  type ComponentDef,
  type FieldDef,
} from "@/lib/catalog"
import { COMPONENT_BLOCK_PREFIX, PIPELINE_BLOCK_TYPE, fieldName } from "@/lib/spec"
import { helpUrlFor } from "@/blockly/helpUrls"

const COMPONENT_CONNECTION = "spacy_component"

/** Ensure the multiline field type is registered (plugin ships its own name). */
export function registerFields(): void {
  if (!Blockly.registry.hasItem(Blockly.registry.Type.FIELD, "field_multilinetext")) {
    Blockly.fieldRegistry.register("field_multilinetext", FieldMultilineInput)
  }
}

function fieldToJson(
  field: FieldDef,
  defaultValue: unknown
): Record<string, unknown>[] {
  const name = fieldName(field.key)
  const label = { type: "field_label", text: `${field.label}:` }
  switch (field.widget) {
    case "checkbox":
      return [label, { type: "field_checkbox", name, checked: defaultValue === true }]
    case "number":
      return [
        label,
        {
          type: "field_number",
          name,
          value: typeof defaultValue === "number" ? defaultValue : 0,
          ...(field.min !== undefined ? { min: field.min } : {}),
          ...(field.precision !== undefined ? { precision: field.precision } : {}),
        },
      ]
    case "dropdown":
      // Options already lead with a "__default__" sentinel where a factory
      // default should be left unset; Blockly selects options[0] initially.
      return [label, { type: "field_dropdown", name, options: field.options }]
    case "multiline":
      return [label, { type: "field_multilinetext", name, text: "" }]
    default:
      return [label, { type: "field_input", name, text: "" }]
  }
}

export function componentBlockJson(def: ComponentDef): Record<string, unknown> {
  const styleByCategory = {
    trainable: "trainable_blocks",
    rulebased: "rulebased_blocks",
    utility: "utility_blocks",
  } as const

  // Header row: component label + optional custom pipe name, then one row
  // per config field.
  const parts: string[] = ["%1 %2"]
  const finalArgs: Record<string, unknown>[] = [
    { type: "field_label", text: def.label },
    { type: "field_input", name: "NAME", text: "", tooltip: "Optional custom pipe name" },
  ]
  const defaults = factoryMeta[def.factory]?.defaultConfig ?? {}
  let n = 3
  for (const field of def.fields) {
    const [label, control] = fieldToJson(field, defaults[field.key])
    finalArgs.push({ type: "input_dummy" }, label, control)
    parts.push(`%${n} %${n + 1} %${n + 2}`)
    n += 3
  }

  return {
    type: `${COMPONENT_BLOCK_PREFIX}${def.factory}`,
    message0: parts.join(" "),
    args0: finalArgs,
    previousStatement: COMPONENT_CONNECTION,
    nextStatement: COMPONENT_CONNECTION,
    style: styleByCategory[def.category],
    tooltip: def.description,
    helpUrl: helpUrlFor(def.factory),
  }
}

export function defineBlocks(): void {
  registerFields()

  const pipelineBlock = {
    type: PIPELINE_BLOCK_TYPE,
    message0: "spaCy pipeline %1 language %2 base %3 model %4",
    args0: [
      { type: "input_dummy" },
      {
        type: "field_dropdown",
        name: "LANG",
        options: languages.map((l) => [`${l.label} (${l.code})`, l.code]),
      },
      {
        type: "field_dropdown",
        name: "BASE",
        options: [
          ["blank", "blank"],
          ["trained model", "model"],
        ],
      },
      { type: "field_input", name: "MODEL", text: "en_core_web_sm" },
    ],
    message1: "components %1",
    args1: [
      { type: "input_statement", name: "COMPONENTS", check: COMPONENT_CONNECTION },
    ],
    style: "pipeline_blocks",
    tooltip:
      "The pipeline container. Stack component blocks inside; they run top to bottom.",
    helpUrl: "https://spacy.io/usage/processing-pipelines",
  }

  const blockJson = [pipelineBlock, ...catalog.map(componentBlockJson)]
  Blockly.common.defineBlocksWithJsonArray(blockJson as never)
}
