import type { PipelineSpec } from "@/lib/spec"

/** Render a JSON-ish value as a Python literal. */
export function pyLiteral(value: unknown): string {
  if (value === null || value === undefined) return "None"
  if (value === true) return "True"
  if (value === false) return "False"
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map(pyLiteral).join(", ")}]`
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${JSON.stringify(k)}: ${pyLiteral(v)}`
    )
    return `{${entries.join(", ")}}`
  }
  return JSON.stringify(value)
}

const SAMPLE_TEXT = "Apple is looking at buying U.K. startup for $1 billion."

/** Generate runnable Python code from a pipeline spec. */
export function generatePython(spec: PipelineSpec): string {
  const lines: string[] = ["import spacy", ""]
  if (spec.base.type === "model") {
    lines.push(`nlp = spacy.load(${pyLiteral(spec.base.name)})`)
  } else {
    lines.push(`nlp = spacy.blank(${pyLiteral(spec.lang)})`)
  }

  let rulerCount = 0
  for (const comp of spec.components) {
    const args: string[] = [pyLiteral(comp.factory)]
    if (comp.explicitName) args.push(`name=${pyLiteral(comp.name)}`)
    if (Object.keys(comp.config).length) {
      args.push(`config=${pyLiteral(comp.config)}`)
    }
    const call = `nlp.add_pipe(${args.join(", ")})`
    if (comp.patterns?.length) {
      rulerCount += 1
      const varName = rulerCount === 1 ? "ruler" : `ruler${rulerCount}`
      lines.push(`${varName} = ${call}`)
      lines.push(`${varName}.add_patterns(${pyLiteral(comp.patterns)})`)
    } else {
      lines.push(call)
    }
  }

  lines.push("")
  lines.push(`doc = nlp(${pyLiteral(SAMPLE_TEXT)})`)
  lines.push("print([(token.text, token.pos_, token.dep_) for token in doc])")
  lines.push("print([(ent.text, ent.label_) for ent in doc.ents])")
  return lines.join("\n") + "\n"
}
