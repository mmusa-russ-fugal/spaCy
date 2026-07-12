# spaCy Pipeline Composer

A visual, drag-and-drop editor for composing [spaCy processing pipelines](https://spacy.io/usage/processing-pipelines) out of blocks, built with [Google Blockly](https://developers.google.com/blockly), Vite, React, Tailwind CSS, and shadcn/ui-style components.

Stack component blocks (tagger, parser, ner, entity ruler, …) inside a pipeline block and get three live outputs:

- **Python** — runnable `spacy.blank(...)` / `nlp.add_pipe(...)` code
- **config.cfg** — a minimal, valid spaCy config (loads with `spacy.util.load_model_from_config` and `spacy assemble`)
- **Run** — execute the pipeline on sample text and see tokens, entities, sentences, and displaCy visualizations

The UI is responsive: a two-pane layout on desktop, and on phones a full-width touch canvas with the output panel in a bottom drawer.

## Quick start

```bash
cd pipeline-composer
npm install
npm run dev          # UI at http://localhost:5173
```

The composer is fully usable without any backend: compose pipelines, export Python / config.cfg / workspace JSON.

## Live execution engines

The **Run** tab needs a Python engine. Two are supported, auto-detected in this order:

1. **Local run server** (recommended — uses your installed spaCy, supports trained models):

   ```bash
   pip install spacy          # or use this repo's spaCy
   python server/run_server.py --port 8765
   ```

   Endpoints: `GET /api/health`, `POST /api/run` (`{"spec": ..., "text": ...}`).
   The server binds to `127.0.0.1` only, caps text at 10,000 characters, and caches the last 4 built pipelines.

2. **In-browser engine (Pyodide)** — if no local server is found, the Run tab offers a one-time ~50 MB download of Python + spaCy compiled to WebAssembly (community wheels for spaCy 3.7.5 from [liu-nlp/spacy-pyodide](https://github.com/liu-nlp/spacy-pyodide)). Limitations: blank pipelines only (no trained models), and languages whose tokenizers need native dependencies (ja, ko, th) are unavailable.

Both engines run the same `runner/spacy_runner.py`, so behavior is identical: untrained trainable components are skipped with a warning instead of failing the run.

## Project layout

```
scripts/generate_component_meta.py  dumps FactoryMeta -> src/generated/factory-meta.json
runner/spacy_runner.py              run_spec(); shared by the server AND Pyodide (?raw import)
server/run_server.py                stdlib-only HTTP server (no extra dependencies)
server/test_spacy_runner.py         pytest suite for the runner
src/lib/catalog.ts                  UI metadata for the ~19 core components (labels, fields, categories)
src/lib/spec.ts                     Blockly workspace JSON -> neutral PipelineSpec
src/lib/pygen.ts / cfggen.ts        PipelineSpec -> Python / config.cfg
src/lib/validate.ts                 soft warnings from requires/assigns metadata
src/blockly/                        block definitions, toolbox, theme (generated from the catalog)
src/runtime/                        engine detection, backend client, Pyodide loader
```

### Keeping component metadata in sync

Block fields, defaults, and the requires/assigns data used for ordering warnings come from spaCy itself. After upgrading spaCy, regenerate and commit:

```bash
pip install "spacy>=3.8,<3.9"
python scripts/generate_component_meta.py
```

A vitest drift check fails if `src/lib/catalog.ts` references a factory or config key that no longer exists in the generated JSON.

## Tests

```bash
npx vitest run                       # spec traversal, codegen, validation, drift checks
python -m pytest server/            # runner behavior against installed spaCy
npm run build && npm run preview    # production bundle
```

Manual end-to-end checklist:

1. `npm run dev`, load the "Rule-based NER demo" example (Examples menu).
2. Copy the Python tab output into a `python` session — it should print ORG/GPE/MONEY entities.
3. Download the config.cfg and check `spacy.util.load_model_from_config(Config().from_disk("config.cfg"), auto_fill=True)` builds.
4. Start `python server/run_server.py`, open the Run tab — badge shows "Local server", Run renders entities.
5. Stop the server, re-check, click "Enable in-browser engine" — the same pipeline runs via Pyodide (network access to cdn.jsdelivr.net and raw.githubusercontent.com required).
6. Narrow the window below 1024 px — the toolbox moves to the top and the output panel becomes a bottom drawer.

## Scope

Core built-in components only (no `entity_linker`, `beam_*`, third-party factories). Training itself is out of scope — the config.cfg export is the bridge to `spacy train`. Ruler patterns are embedded in the generated Python; config.cfg can't express them, so a comment marks where to add them.
