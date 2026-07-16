/**
 * The Blockly workspace for the pipeline builder: a real drag-and-drop
 * editor implementing the seam contract the placeholder widget documented,
 * so the chrome (widget.tsx), generators and presets stay editor-agnostic:
 *
 *   ({ state, setState, preset }) => JSX
 *
 * The state shape is `BuilderState` (see spec.ts): the workspace loads the
 * blocks from `state` on mount and whenever a state object it did not emit
 * itself comes in from above (i.e. reset), and translates workspace change
 * events back into the shared state shape via `setState`.
 *
 * As an additive extension of that contract, `onWarnings` reports the
 * ported composer validation (validate.ts) upward; the same warnings are
 * attached to the offending blocks as Blockly warning icons.
 *
 * Injection options are ported from the composer's BlocklyCanvas, adapted
 * to the docs context: mouse-wheel scroll/zoom is disabled so the canvas
 * never hijacks page scrolling, the editor height comes from the preset,
 * and media files are self-hosted under /blockly-media/.
 */
import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'

import { defineBlocks } from './blocks'
import type { BuilderPreset } from './presets'
import { workspaceJsonFromState } from './serialize'
import type { BuilderState } from './spec'
import { stateFromWorkspace } from './spec'
import { composerTheme } from './theme'
import { buildToolbox } from './toolbox'
import type { ValidationWarning } from './validate'
import { validateState } from './validate'
import classes from '../../styles/blockly-pipeline.module.sass'

export interface BlocklyWorkspaceProps {
    state: BuilderState
    setState: (state: BuilderState) => void
    preset: BuilderPreset
    /** Optional: receives the validation warnings on every change. */
    onWarnings?: (warnings: ValidationWarning[]) => void
}

function applyBlockWarnings(workspace: Blockly.WorkspaceSvg, warnings: ValidationWarning[]) {
    const byBlock = new Map<string, string[]>()
    for (const w of warnings) {
        if (!w.blockId) continue
        byBlock.set(w.blockId, [...(byBlock.get(w.blockId) ?? []), w.message])
    }
    for (const block of workspace.getAllBlocks(false)) {
        const messages = byBlock.get(block.id)
        block.setWarningText(messages ? messages.join('\n') : null)
    }
}

/**
 * Fit the loaded blocks into the canvas: the preset workspaces (e.g. the
 * tour's six-component stack) can be taller than the preset height, and a
 * cropped initial view hides blocks. Zoom to fit, clamped so single-block
 * presets don't balloon and text never shrinks below legibility — beyond
 * the clamp the workspace scrolls (scrollbars/drag stay enabled).
 */
function fitWorkspace(workspace: Blockly.WorkspaceSvg) {
    workspace.zoomToFit()
    const clamped = Math.min(Math.max(workspace.scale, 0.6), 0.85)
    if (clamped !== workspace.scale) {
        workspace.setScale(clamped)
        workspace.scrollCenter()
    }
}

function loadState(workspace: Blockly.WorkspaceSvg, state: BuilderState, preset: BuilderPreset) {
    workspace.clear()
    // Serialized JSON is structurally valid by construction; same boundary
    // cast the composer uses for Blockly's loosely typed load().
    Blockly.serialization.workspaces.load(workspaceJsonFromState(state, preset) as never, workspace)
    fitWorkspace(workspace)
}

export default function BlocklyWorkspace({
    state,
    setState,
    preset,
    onWarnings,
}: BlocklyWorkspaceProps) {
    const hostRef = useRef<HTMLDivElement>(null)
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
    /** The last state this workspace emitted, to tell resets apart from echoes. */
    const lastEmittedRef = useRef<BuilderState | null>(null)
    const stateRef = useRef(state)
    stateRef.current = state
    const setStateRef = useRef(setState)
    setStateRef.current = setState
    const onWarningsRef = useRef(onWarnings)
    onWarningsRef.current = onWarnings

    useEffect(() => {
        const host = hostRef.current
        if (!host) return
        defineBlocks(preset.mode)

        // On small screens a horizontal toolbox along the top leaves far
        // more room for the canvas than the default sidebar.
        const compact = window.matchMedia('(max-width: 767px)').matches
        const toolbox = buildToolbox(preset.toolbox)
        const workspace = Blockly.inject(host, {
            ...(toolbox ? { toolbox, toolboxPosition: 'start', horizontalLayout: compact } : {}),
            theme: composerTheme,
            renderer: 'zelos', // touch-friendly, rounded renderer
            media: '/blockly-media/', // self-hosted, no CDN
            sounds: false,
            trashcan: preset.mode === 'build' || preset.mode === 'config',
            zoom: {
                controls: true,
                wheel: false, // don't hijack page scrolling
                pinch: true,
                startScale: compact ? 0.65 : 0.8,
                minScale: 0.4,
                maxScale: 1.5,
            },
            move: {
                scrollbars: true,
                drag: true,
                wheel: false, // don't hijack page scrolling
            },
            grid: { spacing: 24, length: 2, colour: '#d4d4d8', snap: true },
        })
        workspaceRef.current = workspace

        loadState(workspace, stateRef.current, preset)
        // Mark the just-loaded state as emitted so the state-sync effect
        // below doesn't reload it; the load's own (async) change events
        // will emit the converted state and converge.
        lastEmittedRef.current = stateRef.current

        const listener = (event: Blockly.Events.Abstract) => {
            if (event.isUiEvent || workspace.isDragging()) return
            const serialized = Blockly.serialization.workspaces.save(workspace)
            const { state: next, issues } = stateFromWorkspace(serialized, preset)
            const warnings = validateState(next, preset, issues)
            applyBlockWarnings(workspace, warnings)
            lastEmittedRef.current = next
            setStateRef.current(next)
            onWarningsRef.current?.(warnings)
        }
        workspace.addChangeListener(listener)

        const resizeObserver = new ResizeObserver(() => {
            Blockly.svgResize(workspace)
        })
        resizeObserver.observe(host)

        return () => {
            resizeObserver.disconnect()
            workspace.removeChangeListener(listener)
            workspace.dispose()
            workspaceRef.current = null
        }
    }, [preset])

    // Reload the blocks when a state object arrives that this workspace did
    // not emit itself — i.e. the initial state was replaced from outside
    // (reset button). Echoes of our own setState calls are skipped.
    useEffect(() => {
        const workspace = workspaceRef.current
        if (!workspace || state === lastEmittedRef.current) return
        lastEmittedRef.current = state
        loadState(workspace, state, preset)
    }, [state, preset])

    return (
        <div
            ref={hostRef}
            className={classes['canvas']}
            style={{ height: preset.height }}
            aria-label="Pipeline builder canvas"
        />
    )
}
