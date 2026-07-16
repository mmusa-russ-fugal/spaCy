/**
 * Container for the pipeline builder widget: owns the workspace state,
 * runs the generators and wires everything into the chrome. Only ever
 * loaded client-side via the next/dynamic wrapper in
 * ../blockly-pipeline-builder.tsx — Blockly needs the DOM, so nothing in
 * this directory may be imported from server-rendered modules.
 */
import { useState } from 'react'
import Prism from 'prismjs'

import 'prismjs/components/prism-python.min.js'
import 'prismjs/components/prism-ini.min.js'

import Icon from '../../components/icon'
import type { BlocklyPipelineBuilderProps } from '../../types'
import { generate } from './generators'
import PRESETS from './presets'
import type { BuilderPreset } from './presets'
import { composerHref } from './share'
import type { BuilderState, PipelineComponentState } from './spec'
import type { ValidationWarning } from './validate'
import PipelineBuilderWidget from './widget'
import BlocklyWorkspace from './workspace'
import classes from '../../styles/blockly-pipeline.module.sass'

const initialState = (preset: BuilderPreset): BuilderState => ({
    lang: preset.workspace.lang,
    base: preset.workspace.base,
    // Pipeline entries in presets are either plain factory names or
    // objects with additional settings (e.g. source)
    pipeline: preset.workspace.pipeline
        .map((component) => (typeof component === 'string' ? { name: component } : component))
        .map((component): PipelineComponentState => ({
            name: component.name,
            factory: component.factory ?? component.name,
            source: component.source ?? null,
            disabled: false,
            // Only 'tour' presets seed the workspace with the base
            // pipeline's own components (see generatePython's fromBase
            // skip) — other modes' initial pipelines are additions on
            // top of (or independent of) the base, not part of it.
            fromBase: preset.mode === 'tour' && !!preset.workspace.base,
        })),
    placement: { arg: preset.mode === 'snippet' ? 'before' : 'last', target: 'ner' },
})

function WarningsList({ warnings }: { warnings: ValidationWarning[] }) {
    if (!warnings.length) return null
    return (
        <ul className={classes['warnings']}>
            {warnings.map((warning, i) => (
                <li key={i} className={classes['warning']}>
                    <Icon width={16} name={warning.level === 'warning' ? 'warning' : 'info'} />{' '}
                    {warning.message}
                </li>
            ))}
        </ul>
    )
}

export default function BlocklyPipelineBuilder({
    preset: presetId,
    title,
}: BlocklyPipelineBuilderProps) {
    // MDX attributes are not typechecked, so guard the preset id at runtime
    // like the placeholder did.
    const preset = PRESETS[presetId] as BuilderPreset | undefined
    if (!preset) {
        throw new Error(`Unknown Blockly pipeline builder preset: ${presetId}`)
    }
    const [state, setState] = useState<BuilderState>(() => initialState(preset))
    const [warnings, setWarnings] = useState<ValidationWarning[]>([])
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
            openInComposerHref={composerHref(state)}
            onReset={() => {
                setState(initialState(preset))
                setWarnings([])
            }}
        >
            <BlocklyWorkspace
                state={state}
                setState={setState}
                preset={preset}
                onWarnings={setWarnings}
            />
            <WarningsList warnings={warnings} />
        </PipelineBuilderWidget>
    )
}
