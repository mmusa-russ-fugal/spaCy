import { catalogByFactory, factoryMeta } from "@/lib/catalog"
import type { PipelineSpec, SpecIssue } from "@/lib/spec"

export type WarningLevel = "warning" | "info"

export interface ValidationWarning {
  blockId?: string
  level: WarningLevel
  message: string
}

/**
 * Soft validation of a pipeline spec using the requires/assigns metadata
 * dumped from spaCy. These are warnings, not errors — the pipeline still
 * builds; the backend's analyze_pipes() result is the authoritative check.
 */
export function validateSpec(
  spec: PipelineSpec,
  specIssues: SpecIssue[] = []
): ValidationWarning[] {
  const warnings: ValidationWarning[] = specIssues.map((issue) => ({
    blockId: issue.blockId,
    level: "warning",
    message: issue.message,
  }))

  // A trained model base provides its own annotations; we can't know which,
  // so requires-checks are skipped in that case.
  const baseIsModel = spec.base.type === "model"
  const provided = new Set<string>()

  for (const comp of spec.components) {
    const meta = factoryMeta[comp.factory]
    const def = catalogByFactory[comp.factory]
    if (!meta || !def) continue

    if (!baseIsModel) {
      for (const req of meta.requires) {
        if (!provided.has(req)) {
          warnings.push({
            blockId: comp.blockId,
            level: "warning",
            message: `"${comp.name}" needs ${req}, but no earlier component sets it.`,
          })
        }
      }
    }

    if (def.trainable && !baseIsModel) {
      warnings.push({
        blockId: comp.blockId,
        level: "info",
        message: `"${comp.name}" is trainable and untrained on a blank pipeline — it will produce no useful output until trained.`,
      })
    }

    if (meta.retokenizes) {
      const later = spec.components.slice(spec.components.indexOf(comp) + 1)
      const annotatorAfter = later.find((c) => factoryMeta[c.factory]?.assigns.length)
      if (annotatorAfter) {
        warnings.push({
          blockId: annotatorAfter.blockId,
          level: "info",
          message: `"${comp.name}" retokenizes the doc; "${annotatorAfter.name}" runs after it and may behave unexpectedly.`,
        })
      }
    }

    meta.assigns.forEach((a) => provided.add(a))
  }

  return warnings
}
