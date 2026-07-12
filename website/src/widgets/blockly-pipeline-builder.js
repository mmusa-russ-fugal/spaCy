import dynamic from 'next/dynamic'

/**
 * Client-only wrapper for the Blockly pipeline builder. Blockly requires
 * window/DOM, so the editor must never be server-rendered: keep ssr: false
 * and keep all 'blockly' imports inside ./blockly/builder.js. This module
 * is registered in src/remark.js and used in MDX files as
 * <BlocklyPipelineBuilder preset="..." /> — see src/widgets/blockly/presets.js
 * for the available presets (one per docs location).
 */
export default dynamic(() => import('./blockly/builder'), {
    ssr: false,
    loading: () => <div style={{ padding: '1rem' }}>Loading pipeline builder...</div>,
})
