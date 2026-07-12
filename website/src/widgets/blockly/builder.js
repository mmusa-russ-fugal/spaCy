import React from 'react'
import PropTypes from 'prop-types'

import Infobox from '../../components/infobox'
import { InlineCode } from '../../components/inlineCode'
import PRESETS from './presets'

/**
 * Placeholder skeleton for the Blockly pipeline builder.
 *
 * This component is only ever loaded client-side (via the next/dynamic
 * wrapper in ../blockly-pipeline-builder.js) because Blockly needs the DOM.
 * The real editor replaces the placeholder below by:
 *
 *   1. importing 'blockly' here (and only here),
 *   2. injecting a workspace into the mount <div> in a useEffect, using
 *      preset.toolbox / preset.workspace to build the toolbox XML and
 *      the initial blocks, and disposing the workspace on unmount,
 *   3. subscribing to workspace changes and rendering the generated
 *      Python or config.cfg output (preset.output) in a code pane next
 *      to the editor.
 *
 * See ./README.md for the full integration plan and ./presets.js for the
 * per-location configuration.
 */
export default function BlocklyPipelineBuilder({ preset: presetId, title }) {
    const preset = PRESETS[presetId]
    if (!preset) {
        throw new Error(`Unknown Blockly pipeline builder preset: ${presetId}`)
    }
    return (
        <Infobox title={title || 'Interactive pipeline builder'} emoji="🧩">
            <p>
                A visual (Blockly) pipeline editor will be embedded here — preset{' '}
                <InlineCode>{presetId}</InlineCode>, mode <InlineCode>{preset.mode}</InlineCode>,
                generating <InlineCode>{preset.output}</InlineCode> output. Drag component blocks
                into the pipeline and copy the generated code.
            </p>
            <div
                data-blockly-mount
                data-blockly-preset={presetId}
                style={{ minHeight: preset.height, display: 'none' }}
            />
        </Infobox>
    )
}

BlocklyPipelineBuilder.propTypes = {
    preset: PropTypes.oneOf(Object.keys(PRESETS)).isRequired,
    title: PropTypes.string,
}
