import { RunTab } from "@/components/RunTab"
import { CodeView } from "@/components/CodeView"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PipelineSpec } from "@/lib/spec"

export interface OutputTabsProps {
  spec: PipelineSpec | null
  pythonCode: string
  configCfg: string
}

const EMPTY_HINT =
  "Drag a “spaCy pipeline” block from the Pipeline category onto the canvas, then stack components inside it."

export function OutputTabs({ spec, pythonCode, configCfg }: OutputTabsProps) {
  return (
    <Tabs defaultValue="python" className="h-full min-h-0 gap-0">
      <TabsList className="m-2 grid w-auto shrink-0 grid-cols-3">
        <TabsTrigger value="python">Python</TabsTrigger>
        <TabsTrigger value="config">config.cfg</TabsTrigger>
        <TabsTrigger value="run">Run</TabsTrigger>
      </TabsList>
      <TabsContent value="python" className="min-h-0">
        <CodeView code={pythonCode} filename="pipeline.py" emptyHint={EMPTY_HINT} />
      </TabsContent>
      <TabsContent value="config" className="min-h-0">
        <CodeView code={configCfg} filename="config.cfg" emptyHint={EMPTY_HINT} />
      </TabsContent>
      <TabsContent value="run" className="min-h-0">
        <RunTab spec={spec} />
      </TabsContent>
    </Tabs>
  )
}
