# Blockly pipeline builder

An interactive [Blockly](https://developers.google.com/blockly) editor that
lets readers assemble a spaCy processing pipeline visually — drag component
blocks (`tok2vec`, `tagger`, `parser`, `ner`, custom components, …) into a
pipeline block and see the generated Python (`nlp.add_pipe(...)`) or
`config.cfg` output update live.

**Current status: placeholder.** The `SimpleWorkspace` below is a plain-React
stand-in that proves the embed seam works end-to-end; the real Blockly editor
is a separate later track that swaps it in without touching the rest.

## How it plugs into the website

The website renders `.mdx` files from `website/docs/` and maps custom
components in [`src/remark.js`](../../remark.js). Interactive widgets live in
`src/widgets/` (see `quickstart-training.js` for the closest precedent — it is
also a "configure a pipeline, get a config file" widget).

The builder follows the same pattern:

-   `src/widgets/blockly-pipeline-builder.js` — `next/dynamic` wrapper with
    `ssr: false`. Blockly requires `window`/DOM, so the editor must never be
    server-rendered. This is the module registered in `remark.js` and used in
    MDX as `<BlocklyPipelineBuilder preset="..." />`.
-   `src/widgets/blockly/builder.js` — stateful container: owns the workspace
    state, runs the generators and composes the widget from the parts below.
-   `src/widgets/blockly/widget.js` — editor-agnostic chrome: header with
    reset button, a workspace slot (`children`) and the generated-code pane
    with Prism highlighting, copy and download actions.
-   `src/widgets/blockly/workspace.js` — `SimpleWorkspace`, a plain-React
    workspace (component chips with add/remove/reorder/disable/source
    controls, argument fields in snippet mode). **This is the part the
    Blockly editor replaces**: a `BlocklyWorkspace` component implementing
    the same `({ state, setState, preset })` contract (state shape documented
    in `workspace.js`) can be swapped in via `builder.js` without touching
    the chrome, generators or presets.
-   `src/widgets/blockly/generators.js` — pure state → code functions:
    Python (`spacy.blank`/`spacy.load` + `add_pipe`/`disable_pipe`),
    `config.cfg` (INI with `factory`/`source`/`frozen_components`) and the
    single-call `add_pipe` snippet. The Blockly block generators should
    emit the same output.
-   `src/widgets/blockly/components.js` — metadata for the built-in
    component factories (name, description, API link) backing the toolbox
    today and the Blockly block definitions later.
-   `src/widgets/blockly/presets.js` — one preset entry **per docs location**
    where the widget is embedded. Each preset documents the location, the
    editor mode, which block categories are exposed, the starting workspace and
    the generated-output format. The MDX pages only pass a `preset` id, so all
    integration-specific configuration stays in one file.
-   `src/styles/blockly-pipeline.module.sass` — widget styles.

## Where it appears (integration locations)

| Preset               | Page + anchor                           | Mode      | Purpose                                                                                              |
| -------------------- | --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `spacy-101`          | `/usage/spacy-101#pipelines`            | `tour`    | Compact, mostly read-only demo of the tokenizer → components flow for first-time readers.            |
| `pipelines-overview` | `/usage/processing-pipelines#pipelines` | `build`   | Full builder: add/reorder/disable built-in components, generate `spacy.load` / `add_pipe` Python.    |
| `training-config`    | `/usage/training#config-components`     | `config`  | Config-oriented builder: assemble `[nlp] pipeline` + `[components]` blocks, download `config.cfg`.   |
| `api-add-pipe`       | `/api/language#add_pipe`                | `snippet` | Minimal single-call builder for `add_pipe` arguments (`before`/`after`/`first`/`last`, `source`, …). |

Each MDX location contains a `{/* BLOCKLY-PIPELINE-BUILDER ... */}` comment
next to the component with the location-specific configuration notes.

## Remaining work to swap in the Blockly editor

The widget is fully functional with the simple workspace; replacing it
with the Blockly editor is now contained to one seam:

1. Add dependencies to `website/package.json`: `blockly` (and optionally
   `react-blockly`, or mount Blockly manually via `Blockly.inject` in a
   `useEffect` with cleanup via `workspace.dispose()`).
2. Create `src/widgets/blockly/blockly-workspace.js` implementing the
   `({ state, setState, preset })` contract from `workspace.js`: build the
   toolbox from `preset.toolbox` + `components.js`, load the initial blocks
   from `state`, and translate workspace change events back into the shared
   state shape via `setState`. Use `preset.height` for the editor size.
3. Swap `SimpleWorkspace` for the new component in `builder.js` (keep
   `SimpleWorkspace` as the no-JS/fallback option if desired).
4. Keep the component client-only: all Blockly imports must stay inside
   `blockly-workspace.js`/`builder.js` (loaded via `next/dynamic`), never
   in `remark.js` or page modules.
