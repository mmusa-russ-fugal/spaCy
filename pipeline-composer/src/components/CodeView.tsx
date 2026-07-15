import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export interface CodeViewProps {
  code: string
  filename: string
  emptyHint: string
}

export function CodeView({ code, filename, emptyHint }: CodeViewProps) {
  const [copied, setCopied] = useState(false)

  if (!code) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {emptyHint}
      </div>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not access the clipboard.")
    }
  }

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative h-full min-h-0">
      <div className="absolute right-3 top-2 z-10 flex gap-1">
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="secondary" size="sm" onClick={download}>
          <DownloadIcon />
          {filename}
        </Button>
      </div>
      <div className="h-full overflow-auto">
        <pre className="min-h-full whitespace-pre p-4 pt-12 font-mono text-xs leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  )
}
