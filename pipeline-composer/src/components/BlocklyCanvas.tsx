import { useEffect, useRef } from "react"
import * as Blockly from "blockly"

import { defineBlocks } from "@/blockly/blocks"
import { toolbox } from "@/blockly/toolbox"
import { composerDarkTheme, composerTheme } from "@/blockly/theme"

const isDarkMode = () => document.documentElement.classList.contains("dark")

let blocksDefined = false

export interface BlocklyCanvasProps {
  /** Called with the serialized workspace state on every meaningful change. */
  onChange: (state: unknown) => void
  /** Called once with the workspace so parents can load/save/highlight. */
  onReady?: (workspace: Blockly.WorkspaceSvg) => void
}

export function BlocklyCanvas({ onChange, onReady }: BlocklyCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const onReadyRef = useRef(onReady)
  onChangeRef.current = onChange
  onReadyRef.current = onReady

  useEffect(() => {
    if (!hostRef.current) return
    if (!blocksDefined) {
      defineBlocks()
      blocksDefined = true
    }

    // On small screens a horizontal toolbox along the top leaves far more
    // room for the canvas than the default sidebar.
    const compact = window.matchMedia("(max-width: 1023px)").matches

    const workspace = Blockly.inject(hostRef.current, {
      toolbox,
      horizontalLayout: compact,
      toolboxPosition: "start",
      theme: isDarkMode() ? composerDarkTheme : composerTheme,
      renderer: "zelos", // touch-friendly, rounded renderer
      media: import.meta.env.BASE_URL + "blockly-media/", // self-hosted, no CDN
      sounds: false,
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        pinch: true,
        startScale: compact ? 0.65 : 0.85,
        minScale: 0.4,
        maxScale: 1.5,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      grid: { spacing: 24, length: 2, colour: "#d4d4d8", snap: true },
    })

    const listener = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent || workspace.isDragging()) return
      onChangeRef.current(Blockly.serialization.workspaces.save(workspace))
    }
    workspace.addChangeListener(listener)
    onReadyRef.current?.(workspace)

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace)
    })
    resizeObserver.observe(hostRef.current)

    // Follow the app's light/dark toggle: useTheme flips the `.dark` class on
    // <html>, so recolour the canvas chrome whenever that class changes.
    const themeObserver = new MutationObserver(() => {
      workspace.setTheme(isDarkMode() ? composerDarkTheme : composerTheme)
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      workspace.removeChangeListener(listener)
      workspace.dispose()
    }
  }, [])

  return <div ref={hostRef} className="size-full min-h-0" />
}
