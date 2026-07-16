import dynamic from 'next/dynamic'

/**
 * Client-only wrapper for the Blockly pipeline builder. Blockly requires
 * window/DOM, so the editor must never be server-rendered: keep ssr: false
 * and keep all 'blockly' imports inside ./blockly/ (loaded via this dynamic
 * import, which also code-splits the heavy Blockly bundle so it is only
 * fetched on pages that actually render the widget). This module is
 * registered in src/remark.ts and used in MDX files as
 * <BlocklyPipelineBuilder preset="..." /> — see src/widgets/blockly/presets.ts
 * for the available presets (one per docs location).
 */
export default dynamic(() => import('./blockly/builder'), {
    ssr: false,
    loading: () => <div style={{ padding: '1rem' }}>Loading pipeline builder...</div>,
})
