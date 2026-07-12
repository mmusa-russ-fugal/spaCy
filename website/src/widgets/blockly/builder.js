import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Prism from 'prismjs'

import 'prismjs/components/prism-python.min.js'
import 'prismjs/components/prism-ini.min.js'

import PRESETS from './presets'
import PipelineBuilderWidget from './widget'
import SimpleWorkspace from './workspace'
import { generate } from './generators'

/**
 * Container for the pipeline builder widget: owns the workspace state,
 * runs the generators and wires everything into the chrome. Only ever
 * loaded client-side via the next/dynamic wrapper in
 * ../blockly-pipeline-builder.js.
 *
 * To swap in the Blockly editor, replace SimpleWorkspace below with a
 * BlocklyWorkspace component implementing the same contract (see
 * workspace.js for the state shape) — the chrome, generators and presets
 * are already editor-agnostic.
 */

const initialState = (preset) => ({
    lang: preset.workspace.lang,
    base: preset.workspace.base,
    // Pipeline entries in presets are either plain factory names or
    // objects with additional settings (e.g. source)
    pipeline: preset.workspace.pipeline
        .map((component) => (typeof component === 'string' ? { name: component } : component))
        .map((component) => ({
            source: null,
            disabled: false,
            fromBase: !!preset.workspace.base,
            factory: component.factory || component.name,
            ...component,
        })),
    placement: { arg: preset.mode === 'snippet' ? 'before' : 'last', target: 'ner' },
})

export default function BlocklyPipelineBuilder({ preset: presetId, title }) {
    const preset = PRESETS[presetId]
    if (!preset) {
        throw new Error(`Unknown Blockly pipeline builder preset: ${presetId}`)
    }
    const [state, setState] = useState(() => initialState(preset))
    const rawCode = generate(state, preset)
    const prismLang = preset.output === 'ini' ? 'ini' : 'python'
    const code = Prism.highlight(rawCode, Prism.languages[prismLang], prismLang)

    return (
        <PipelineBuilderWidget
            title={title || 'Interactive pipeline builder'}
            code={code}
            rawCode={rawCode}
            codeLang={prismLang}
            download={preset.download}
            onReset={() => setState(initialState(preset))}
        >
            <SimpleWorkspace state={state} setState={setState} preset={preset} />
        </PipelineBuilderWidget>
    )
}

BlocklyPipelineBuilder.propTypes = {
    preset: PropTypes.oneOf(Object.keys(PRESETS)).isRequired,
    title: PropTypes.string,
}
