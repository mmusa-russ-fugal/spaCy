/**
 * Block definitions for the pipeline builder, ported from
 * `pipeline-composer/src/blockly/blocks.ts` (19 component blocks generated
 * from the FactoryMeta catalog plus the pipeline container) and adapted to
 * the docs presets:
 *
 *  - Component blocks gain the docs-specific rows: a "source" dropdown
 *    (train from the factory vs. copy from a trained pipeline) and a
 *    "disable"/"freeze" checkbox — the semantics the placeholder widget's
 *    state shape documents (see spec.ts).
 *  - Definitions are mode-dependent (each docs page renders exactly one
 *    preset): tour blocks only expose the disable checkbox; config mode's
 *    pipeline block drops the base/model fields and labels the checkbox
 *    "freeze"; snippet mode adds a standalone `spacy_add_pipe` block with
 *    the placement fields from the add_pipe API table.
 */
import * as Blockly from 'blockly/core'
import { FieldMultilineInput } from '@blockly/field-multilineinput'

import { catalog, factoryMeta, languages } from './catalog'
import type { ComponentDef, FieldDef } from './catalog'
import { helpUrlFor } from './helpUrls'
import type { PresetMode } from './presets'
import { ADD_PIPE_BLOCK_TYPE, COMPONENT_BLOCK_PREFIX, PIPELINE_BLOCK_TYPE, fieldName } from './spec'

const COMPONENT_CONNECTION = 'spacy_component'

/** Ensure the multiline field type is registered (plugin ships its own name). */
export function registerFields(): void {
    if (!Blockly.registry.hasItem(Blockly.registry.Type.FIELD, 'field_multilinetext')) {
        Blockly.fieldRegistry.register('field_multilinetext', FieldMultilineInput)
    }
}

function fieldToJson(field: FieldDef, defaultValue: unknown): Record<string, unknown>[] {
    const name = fieldName(field.key)
    const label = { type: 'field_label', text: `${field.label}:` }
    switch (field.widget) {
        case 'checkbox':
            return [label, { type: 'field_checkbox', name, checked: defaultValue === true }]
        case 'number':
            return [
                label,
                {
                    type: 'field_number',
                    name,
                    value: typeof defaultValue === 'number' ? defaultValue : 0,
                    ...(field.min !== undefined ? { min: field.min } : {}),
                    ...(field.precision !== undefined ? { precision: field.precision } : {}),
                },
            ]
        case 'dropdown':
            // Options already lead with a "__default__" sentinel where a factory
            // default should be left unset; Blockly selects options[0] initially.
            return [label, { type: 'field_dropdown', name, options: field.options }]
        case 'multiline':
            return [label, { type: 'field_multilinetext', name, text: '' }]
        default:
            return [label, { type: 'field_input', name, text: '' }]
    }
}

const styleByCategory = {
    trainable: 'trainable_blocks',
    rulebased: 'rulebased_blocks',
    utility: 'utility_blocks',
} as const

/** Sources offered by the component blocks' source dropdown. */
const SOURCE_OPTIONS: [string, string][] = [
    ['train from scratch', ''],
    ['source: en_core_web_sm', 'en_core_web_sm'],
]

export function componentBlockJson(def: ComponentDef, mode: PresetMode): Record<string, unknown> {
    // Header row: component label + optional custom pipe name; a docs row
    // with the source dropdown and disable/freeze checkbox; then one row
    // per config field (composer layout).
    const parts: string[] = []
    const finalArgs: Record<string, unknown>[] = []
    let n = 1
    const pushRow = (args: Record<string, unknown>[]) => {
        parts.push(args.map(() => `%${n++}`).join(' '))
        finalArgs.push(...args)
    }

    const header: Record<string, unknown>[] = [{ type: 'field_label', text: def.label }]
    if (mode !== 'tour') {
        header.push({
            type: 'field_input',
            name: 'NAME',
            text: '',
            tooltip: 'Optional custom pipe name',
        })
    }
    pushRow(header)

    const toggleLabel = mode === 'config' ? 'freeze:' : 'disable:'
    const docsRow: Record<string, unknown>[] = [{ type: 'input_dummy' }]
    if (mode !== 'tour') {
        docsRow.push(
            { type: 'field_label', text: 'weights:' },
            { type: 'field_dropdown', name: 'SOURCE', options: SOURCE_OPTIONS }
        )
    }
    docsRow.push(
        { type: 'field_label', text: toggleLabel },
        { type: 'field_checkbox', name: 'DISABLED', checked: false }
    )
    pushRow(docsRow)

    if (mode !== 'tour') {
        const defaults = factoryMeta[def.factory]?.defaultConfig ?? {}
        for (const field of def.fields) {
            const [label, control] = fieldToJson(field, defaults[field.key])
            pushRow([{ type: 'input_dummy' }, label, control])
        }
    }

    return {
        type: `${COMPONENT_BLOCK_PREFIX}${def.factory}`,
        message0: parts.join(' '),
        args0: finalArgs,
        previousStatement: COMPONENT_CONNECTION,
        nextStatement: COMPONENT_CONNECTION,
        style: styleByCategory[def.category],
        tooltip: def.description,
        helpUrl: helpUrlFor(def.factory),
    }
}

function pipelineBlockJson(mode: PresetMode): Record<string, unknown> {
    // Config mode drops the base/model fields: a config.cfg excerpt always
    // describes a pipeline built from scratch.
    const withBase = mode !== 'config'
    return {
        type: PIPELINE_BLOCK_TYPE,
        message0: withBase
            ? 'spaCy pipeline %1 language %2 base %3 model %4'
            : 'spaCy pipeline %1 language %2',
        args0: [
            { type: 'input_dummy' },
            {
                type: 'field_dropdown',
                name: 'LANG',
                options: languages.map((l) => [`${l.label} (${l.code})`, l.code]),
            },
            ...(withBase
                ? [
                      {
                          type: 'field_dropdown',
                          name: 'BASE',
                          options: [
                              ['blank', 'blank'],
                              ['trained model', 'model'],
                          ],
                      },
                      { type: 'field_input', name: 'MODEL', text: 'en_core_web_sm' },
                  ]
                : []),
        ],
        message1: 'components %1',
        args1: [{ type: 'input_statement', name: 'COMPONENTS', check: COMPONENT_CONNECTION }],
        style: 'pipeline_blocks',
        tooltip: 'The pipeline container. Stack component blocks inside; they run top to bottom.',
        helpUrl: '/usage/processing-pipelines',
    }
}

/** Snippet mode's standalone block: one nlp.add_pipe(...) call. */
function addPipeBlockJson(): Record<string, unknown> {
    return {
        type: ADD_PIPE_BLOCK_TYPE,
        message0: 'nlp.add_pipe %1 factory %2 %3 placement %4 target %5 %6 %7 %8',
        args0: [
            { type: 'input_dummy' },
            {
                type: 'field_dropdown',
                name: 'FACTORY',
                options: catalog.map((c) => [c.factory, c.factory]),
            },
            { type: 'input_dummy' },
            {
                type: 'field_dropdown',
                name: 'PLACEMENT',
                options: [
                    ['last (default)', 'last'],
                    ['first', 'first'],
                    ['before', 'before'],
                    ['after', 'after'],
                ],
            },
            {
                type: 'field_input',
                name: 'TARGET',
                text: 'ner',
                tooltip: 'Component to insert before or after (ignored for first/last)',
            },
            { type: 'input_dummy' },
            { type: 'field_label', text: 'source from trained pipeline:' },
            { type: 'field_checkbox', name: 'SOURCE', checked: false },
        ],
        style: 'pipeline_blocks',
        tooltip:
            'A single nlp.add_pipe() call: combine the placement argument (before/after/first/last) with an optional source= pipeline.',
        helpUrl: '/api/language#add_pipe',
    }
}

let definedForMode: PresetMode | null = null

/**
 * Register the block definitions for the given preset mode. Definitions are
 * global per page, and every docs page embeds exactly one preset, so a mode
 * mismatch can only happen in development hot-reload scenarios — redefining
 * is safe (Blockly overwrites), just noisy, hence the guard.
 */
export function defineBlocks(mode: PresetMode): void {
    if (definedForMode === mode) return
    registerFields()
    const blockJson = [
        pipelineBlockJson(mode),
        ...catalog.map((def) => componentBlockJson(def, mode)),
        ...(mode === 'snippet' ? [addPipeBlockJson()] : []),
    ]
    // Blockly's JSON-array API is typed looser than our literal objects;
    // same boundary cast the composer uses.
    Blockly.common.defineBlocksWithJsonArray(blockJson as never)
    definedForMode = mode
}
