import {
  DownloadIcon,
  FolderOpenIcon,
  MenuIcon,
  ShapesIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { presets } from "@/lib/presets"
import { downloadJson, pickJsonFile } from "@/lib/storage"

export interface ToolbarProps {
  getWorkspaceState: () => unknown | null
  loadWorkspaceState: (state: unknown) => void
  clearCanvas: () => void
}

export function Toolbar({
  getWorkspaceState,
  loadWorkspaceState,
  clearCanvas,
}: ToolbarProps) {
  const exportJson = () => {
    const state = getWorkspaceState()
    if (!state) return
    downloadJson(state, "spacy-pipeline.json")
  }

  const importJson = async () => {
    const state = await pickJsonFile()
    if (!state) {
      toast.error("Could not read that file as workspace JSON.")
      return
    }
    try {
      loadWorkspaceState(state)
      toast.success("Workspace imported.")
    } catch {
      toast.error("That file is not a valid composer workspace.")
    }
  }

  const presetItems = presets.map((p) => (
    <DropdownMenuItem key={p.id} onSelect={() => loadWorkspaceState(p.workspace)}>
      <div className="flex flex-col">
        <span>{p.label}</span>
        <span className="text-xs text-muted-foreground">{p.description}</span>
      </div>
    </DropdownMenuItem>
  ))

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        className="size-6 shrink-0"
      />
      <span className="mr-1 truncate font-heading text-sm font-semibold tracking-tight">
        spaCy Pipeline Composer
      </span>

      {/* Desktop actions */}
      <div className="ml-auto hidden items-center gap-1.5 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ShapesIcon /> Examples
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-80">
            <DropdownMenuLabel>Example pipelines</DropdownMenuLabel>
            {presetItems}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={exportJson}>
          <DownloadIcon /> Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => void importJson()}>
          <FolderOpenIcon /> Import
        </Button>
        <Button variant="outline" size="sm" onClick={clearCanvas}>
          <Trash2Icon /> Clear
        </Button>
      </div>

      {/* Mobile: collapse actions into one menu */}
      <div className="ml-auto md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Menu">
              <MenuIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-72">
            <DropdownMenuLabel>Example pipelines</DropdownMenuLabel>
            {presetItems}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={exportJson}>
              <DownloadIcon /> Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void importJson()}>
              <FolderOpenIcon /> Import JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={clearCanvas}>
              <Trash2Icon /> Clear canvas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
