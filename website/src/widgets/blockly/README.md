# Blockly pipeline builder

An interactive [Blockly](https://developers.google.com/blockly) editor that
lets readers assemble a spaCy processing pipeline visually — drag component
blocks (`tok2vec`, `tagger`, `parser`, `ner`, …) into a pipeline block and see
the generated Python (`nlp.add_pipe(...)`) or `config.cfg` output update live.

The editor is a port of the standalone **`pipeline-composer/`** app at the
repo root (Vite/React/Blockly): block definitions, theme, toolbox and the
workspace-traversal/validation logic come from there, adapted to the docs
embed modes below. The chrome, presets and the `({ state, setState, preset })`
workspace seam follow the placeholder widget that first proved the embed
integration (PR #8), so the workspace implementation stays swappable.

## How it plugs into the website

The website renders `.mdx` files from `website/docs/` and maps custom
components in [`src/remark.ts`](../../remark.ts). Interactive widgets live in
`src/widgets/` (see `quickstart-training.tsx` for the closest precedent).

- `src/widgets/blockly-pipeline-builder.tsx` — `next/dynamic` wrapper with
  `ssr: false`. Blockly requires `window`/DOM, so the editor must never be
  server-rendered; the dynamic import also code-splits the heavy Blockly
  bundle so it is only fetched on the four embed pages. This is the module
  registered in `remark.ts` and used in MDX as
  `<BlocklyPipelineBuilder preset="..." />`.
- `builder.tsx` — stateful container: owns the seam state, runs the
  generators and composes the widget from the parts below.
- `widget.tsx` — editor-agnostic chrome: header with reset button, a
  workspace slot (`children`) and the generated-code pane with Prism
  highlighting, copy and download actions.
- `workspace.tsx` — `BlocklyWorkspace`, the drag-and-drop canvas. It
  implements the seam contract `({ state, setState, preset })`: blocks are
  loaded from the state, and workspace change events are translated back
  into the shared state shape (documented in `spec.ts`). Injection options
  are the composer's, adapted for prose embedding (no wheel capture,
  preset-driven height, self-hosted media under `public/blockly-media/`).
- `blocks.ts` / `theme.ts` / `toolbox.ts` — the Blockly block definitions
  (pipeline container + 19 component blocks generated from the factory
  catalog + the snippet mode's `spacy_add_pipe` block), the spaCy-coloured
  theme and the per-preset toolbox, ported from
  `pipeline-composer/src/blockly/`.
- `spec.ts` / `serialize.ts` — serialized-workspace → builder-state
  traversal (ported from `pipeline-composer/src/lib/spec.ts`) and its
  inverse, used to seed and reset the canvas.
- `generators.ts` — pure state → code functions: Python
  (`spacy.blank`/`spacy.load` + `add_pipe`/`disable_pipe`), `config.cfg`
  (INI with `factory`/`source`/`frozen_components`) and the single-call
  `add_pipe` snippet, with literal rendering, `config=` overrides and ruler
  patterns ported from the composer's `pygen.ts`/`cfggen.ts`.
- `validate.ts` — soft validation (requires/assigns, duplicate-name E007,
  retokenization ordering) ported from the composer and surfaced both as
  Blockly block warnings and a list under the canvas.
- `catalog.ts` / `helpUrls.ts` — component metadata: labels, descriptions,
  config fields and docs links for the built-in factories.
- `presets.ts` — one preset entry **per docs location** where the widget is
  embedded. The MDX pages only pass a `preset` id, so all
  integration-specific configuration stays in one file.
- `src/styles/blockly-pipeline.module.sass` — widget styles.

## Metadata source

`catalog.ts` imports the committed
`pipeline-composer/src/generated/factory-meta.json` directly — the single
source of truth for FactoryMeta (default config, requires/assigns,
retokenizes), dumped from spaCy by
`pipeline-composer/scripts/generate_component_meta.py`. The script needs a
spaCy install, which the website prebuild environment does not have (it only
installs jinja2/srsly), so the website consumes the committed JSON instead of
regenerating it at build time. To refresh: run the composer's generator and
commit the JSON; the composer's vitest suite drift-checks the catalog against
it.

## Where it appears (integration locations)

| Preset               | Page + anchor                           | Mode      | Purpose                                                                                              |
| -------------------- | --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `spacy-101`          | `/usage/spacy-101#pipelines`            | `tour`    | Compact, locked-down demo of the tokenizer → components flow for first-time readers.                 |
| `pipelines-overview` | `/usage/processing-pipelines#pipelines` | `build`   | Full builder: add/reorder/disable built-in components, generate `spacy.load` / `add_pipe` Python.    |
| `training-config`    | `/usage/training#config-components`     | `config`  | Config-oriented builder: assemble `[nlp] pipeline` + `[components]` blocks, download `config.cfg`.   |
| `api-add-pipe`       | `/api/language#add_pipe`                | `snippet` | Minimal single-call builder for `add_pipe` arguments (`before`/`after`/`first`/`last`, `source`, …). |

Each MDX location contains a `{/* BLOCKLY-PIPELINE-BUILDER ... */}` comment
next to the component with the location-specific configuration notes.
