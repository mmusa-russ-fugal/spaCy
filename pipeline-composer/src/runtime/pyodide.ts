import runnerSource from "../../runner/spacy_runner.py?raw"
import type { RunRequest, RunResult } from "@/runtime/types"

/**
 * In-browser engine: Pyodide + community wasm wheels for spaCy 3.7.5 from
 * https://github.com/liu-nlp/spacy-pyodide (CP312, Pyodide 2024.0 ABI, which
 * matches the Pyodide 0.26.x runtime pinned below).
 *
 * Limitations vs the local server: blank pipelines only (no trained model
 * downloads) and spaCy 3.7.5 instead of the repo's version.
 */
const PYODIDE_VERSION = "0.26.4"
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`

const WHEEL_BASE = "https://raw.githubusercontent.com/liu-nlp/spacy-pyodide/main"
const WHEELS = [
  "cymem-2.0.9a2-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "murmurhash-1.0.10-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "preshed-3.0.8-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "blis-0.7.11-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "srsly-2.4.8-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "thinc-8.2.3-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "spacy-3.7.5-cp312-cp312-pyodide_2024_0_wasm32.whl",
].map((name) => `${WHEEL_BASE}/${name}`)

interface PyodideApi {
  loadPackage(names: string[]): Promise<void>
  pyimport(name: string): any
  runPythonAsync(code: string): Promise<any>
  globals: { get(name: string): any }
}

let pyodidePromise: Promise<PyodideApi> | null = null

async function loadEngine(onStage: (stage: string) => void): Promise<PyodideApi> {
  onStage("Loading Pyodide runtime…")
  const mod = await import(/* @vite-ignore */ PYODIDE_CDN)
  const pyodide: PyodideApi = await mod.loadPyodide()

  onStage("Loading micropip…")
  await pyodide.loadPackage(["micropip"])

  onStage("Installing spaCy wheels (~50 MB, one-time)…")
  const micropip = pyodide.pyimport("micropip")
  await micropip.install(WHEELS)

  onStage("Preparing runner…")
  await pyodide.runPythonAsync(runnerSource)
  onStage("Ready")
  return pyodide
}

/** Load (once) and cache the Pyodide engine. Safe to call repeatedly. */
export function getPyodideEngine(
  onStage: (stage: string) => void
): Promise<PyodideApi> {
  if (!pyodidePromise) {
    pyodidePromise = loadEngine(onStage).catch((err) => {
      pyodidePromise = null // allow retry after a failed download
      throw err
    })
  }
  return pyodidePromise
}

export async function runOnPyodide(
  request: RunRequest,
  onStage: (stage: string) => void
): Promise<RunResult> {
  const pyodide = await getPyodideEngine(onStage)
  const runSpecJson = pyodide.globals.get("run_spec_json")
  try {
    const resultJson: string = runSpecJson(
      JSON.stringify(request.spec),
      request.text
    )
    const result = JSON.parse(resultJson) as RunResult & { error?: string }
    if (result.error) throw new Error(result.error)
    result.meta.engine = "pyodide"
    return result
  } finally {
    runSpecJson?.destroy?.()
  }
}

export async function getPyodideSpacyVersion(
  onStage: (stage: string) => void
): Promise<string> {
  const pyodide = await getPyodideEngine(onStage)
  return await pyodide.runPythonAsync("import spacy; spacy.__version__")
}
