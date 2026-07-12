import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RunResult } from "@/runtime/types"

// spaCy website primary font stack (website/src/styles/layout.sass --font-primary)
const DISPLACY_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"

function DisplacyFrame({ html, title }: { html: string; title: string }) {
  // Mirror how the docs render displaCy: site font, dark-on-white, entities at
  // the website's 1.35rem sizing (website/src/styles/layout.sass .entities).
  const doc = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 12px; overflow-x: auto; color: hsl(213 15% 12%); font-family: ${DISPLACY_FONT}; }
    .entities { font-size: 1.15rem; }
    .displacy { color: hsl(213 15% 12%); }
  </style><body>${html}</body>`
  return (
    <iframe
      sandbox=""
      srcDoc={doc}
      title={title}
      className="h-56 w-full rounded-md border bg-white"
    />
  )
}

export function ResultsView({ result }: { result: RunResult }) {
  const hasPos = result.tokens.some((t) => t.pos || t.tag)
  const hasDep = result.tokens.some((t) => t.dep)
  const hasLemma = result.tokens.some((t) => t.lemma && t.lemma !== t.text)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Ran through:</span>
        {result.meta.pipeline.map((p) => (
          <Badge key={p} variant="outline">{p}</Badge>
        ))}
      </div>

      {result.warnings.length > 0 && (
        <div className="space-y-1 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning-foreground dark:text-warning">
          {result.warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}

      {result.displacy.ent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <DisplacyFrame html={result.displacy.ent} title="displaCy entities" />
          </CardContent>
        </Card>
      )}

      {result.displacy.dep && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <DisplacyFrame html={result.displacy.dep} title="displaCy dependencies" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tokens ({result.tokens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1 pr-3 font-medium">Text</th>
                  {hasLemma && <th className="py-1 pr-3 font-medium">Lemma</th>}
                  {hasPos && <th className="py-1 pr-3 font-medium">POS</th>}
                  {hasPos && <th className="py-1 pr-3 font-medium">Tag</th>}
                  {hasDep && <th className="py-1 pr-3 font-medium">Dep</th>}
                  {hasDep && <th className="py-1 pr-3 font-medium">Head</th>}
                  <th className="py-1 pr-3 font-medium">Entity</th>
                </tr>
              </thead>
              <tbody>
                {result.tokens.map((t, i) => (
                  <tr key={i} className="border-b border-border/50 font-mono">
                    <td className="py-1 pr-3">{t.text}</td>
                    {hasLemma && <td className="py-1 pr-3">{t.lemma}</td>}
                    {hasPos && <td className="py-1 pr-3">{t.pos}</td>}
                    {hasPos && <td className="py-1 pr-3">{t.tag}</td>}
                    {hasDep && <td className="py-1 pr-3">{t.dep}</td>}
                    {hasDep && (
                      <td className="py-1 pr-3">{result.tokens[t.head]?.text ?? ""}</td>
                    )}
                    <td className="py-1 pr-3">
                      {t.ent_type ? `${t.ent_iob}-${t.ent_type}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {result.sents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sentences ({result.sents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {result.sents.map((s, i) => (
              <div key={i} className="rounded bg-muted/60 px-2 py-1">{s}</div>
            ))}
          </CardContent>
        </Card>
      )}

      {Object.keys(result.cats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <pre className="font-mono">{JSON.stringify(result.cats, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {Object.keys(result.spans).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spans</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <pre className="font-mono">{JSON.stringify(result.spans, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
