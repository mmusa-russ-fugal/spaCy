import type * as Blockly from "blockly"
import * as BlocklyCore from "blockly/core"
import { PanelRightOpenIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { BlocklyCanvas } from "@/components/BlocklyCanvas"
import { OutputTabs } from "@/components/OutputTabs"
import { Toolbar } from "@/components/Toolbar"
import { WarningsPanel } from "@/components/WarningsPanel"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Toaster } from "@/components/ui/sonner"
import { generateConfig } from "@/lib/cfggen"
import { presets } from "@/lib/presets"
import { generatePython } from "@/lib/pygen"
import { clearShareHash, readSharedWorkspace } from "@/lib/share"
import { specFromWorkspace } from "@/lib/spec"
import { loadWorkspace, saveWorkspace } from "@/lib/storage"
import { validateSpec } from "@/lib/validate"

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches
  )
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)")
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])
  return isDesktop
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export default function App() {
  const isDesktop = useIsDesktop()
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const [workspaceState, setWorkspaceState] = useState<unknown>(null)
  const debouncedState = useDebounced(workspaceState, 250)

  const { spec, warnings, pythonCode, configCfg } = useMemo(() => {
    if (!debouncedState) {
      return { spec: null, warnings: [], pythonCode: "", configCfg: "" }
    }
    const { spec, issues } = specFromWorkspace(debouncedState)
    const warnings = spec
      ? validateSpec(spec, issues)
      : issues.map((i) => ({
          blockId: i.blockId,
          level: "warning" as const,
          message: i.message,
        }))
    return {
      spec,
      warnings,
      pythonCode: spec ? generatePython(spec) : "",
      configCfg: spec ? generateConfig(spec) : "",
    }
  }, [debouncedState])

  // Autosave + attach warnings to the offending blocks.
  useEffect(() => {
    if (debouncedState) saveWorkspace(debouncedState)
    const workspace = workspaceRef.current
    if (!workspace) return
    const byBlock = new Map<string, string[]>()
    for (const w of warnings) {
      if (!w.blockId) continue
      byBlock.set(w.blockId, [...(byBlock.get(w.blockId) ?? []), w.message])
    }
    for (const block of workspace.getAllBlocks(false)) {
      const messages = byBlock.get(block.id)
      block.setWarningText(messages ? messages.join("\n") : null)
    }
  }, [debouncedState, warnings])

  const handleReady = useCallback((workspace: Blockly.WorkspaceSvg) => {
    workspaceRef.current = workspace
    // A pipeline shared from the docs "Open in Composer" link takes priority
    // over any locally saved workspace.
    const shared = readSharedWorkspace()
    const saved = shared ?? loadWorkspace() ?? presets[0].workspace
    try {
      BlocklyCore.serialization.workspaces.load(saved as never, workspace)
    } catch {
      workspace.clear()
    }
    if (shared) {
      // Consume the fragment so a reload doesn't re-import over later edits,
      // and frame the imported pipeline.
      clearShareHash()
      workspace.zoomToFit()
    }
    setWorkspaceState(BlocklyCore.serialization.workspaces.save(workspace))
  }, [])

  const loadState = useCallback((state: unknown) => {
    const workspace = workspaceRef.current
    if (!workspace) return
    BlocklyCore.serialization.workspaces.load(state as never, workspace)
    workspace.zoomToFit()
    setWorkspaceState(BlocklyCore.serialization.workspaces.save(workspace))
  }, [])

  const clearCanvas = useCallback(() => {
    workspaceRef.current?.clear()
    setWorkspaceState(
      workspaceRef.current
        ? BlocklyCore.serialization.workspaces.save(workspaceRef.current)
        : null
    )
  }, [])

  const outputPanel = (
    <OutputTabs spec={spec} pythonCode={pythonCode} configCfg={configCfg} />
  )

  return (
    <div className="flex h-dvh flex-col">
      <Toolbar
        getWorkspaceState={() =>
          workspaceRef.current
            ? BlocklyCore.serialization.workspaces.save(workspaceRef.current)
            : null
        }
        loadWorkspaceState={loadState}
        clearCanvas={clearCanvas}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <BlocklyCanvas onChange={setWorkspaceState} onReady={handleReady} />
          </div>
          <WarningsPanel warnings={warnings} />
        </div>

        {isDesktop && <aside className="min-h-0 border-l">{outputPanel}</aside>}
      </div>

      {!isDesktop && (
        <Drawer>
          <DrawerTrigger asChild>
            <Button className="fixed bottom-4 right-4 z-40 shadow-lg" size="lg">
              <PanelRightOpenIcon /> Output
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[85dvh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Pipeline output</DrawerTitle>
              <DrawerDescription>
                Generated Python code, config.cfg, and live run results.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1">{outputPanel}</div>
          </DrawerContent>
        </Drawer>
      )}

      <Toaster position="top-center" />
    </div>
  )
}
