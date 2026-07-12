import { AlertTriangleIcon, InfoIcon } from "lucide-react"

import type { ValidationWarning } from "@/lib/validate"

export function WarningsPanel({ warnings }: { warnings: ValidationWarning[] }) {
  if (!warnings.length) return null
  return (
    <div className="max-h-32 shrink-0 space-y-1 overflow-y-auto border-t bg-muted/40 px-3 py-2 text-xs">
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-1.5">
          {w.level === "warning" ? (
            <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          ) : (
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-sky-600" />
          )}
          <span className="text-muted-foreground">{w.message}</span>
        </div>
      ))}
    </div>
  )
}
