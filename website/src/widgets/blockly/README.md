# Blockly pipeline builder

An interactive [Blockly](https://developers.google.com/blockly) editor that
lets readers assemble a spaCy processing pipeline visually — drag component
blocks (`tok2vec`, `tagger`, `parser`, `ner`, custom components, …) into a
pipeline block and see the generated Python (`nlp.add_pipe(...)`) or
`config.cfg` output update live.

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
-   `src/widgets/blockly/builder.js` — the actual React component (currently a
    placeholder skeleton; the real editor mounts here).
-   `src/widgets/blockly/presets.js` — one preset entry **per docs location**
    where the widget is embedded. Each preset documents the location, the
    editor mode, which block categories are exposed, the starting workspace and
    the generated-output format. The MDX pages only pass a `preset` id, so all
    integration-specific configuration stays in one file.

## Where it appears (integration locations)

| Preset               | Page + anchor                           | Mode      | Purpose                                                                                              |
| -------------------- | --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `spacy-101`          | `/usage/spacy-101#pipelines`            | `tour`    | Compact, mostly read-only demo of the tokenizer → components flow for first-time readers.            |
| `pipelines-overview` | `/usage/processing-pipelines#pipelines` | `build`   | Full builder: add/reorder/disable built-in components, generate `spacy.load` / `add_pipe` Python.    |
| `training-config`    | `/usage/training#config-components`     | `config`  | Config-oriented builder: assemble `[nlp] pipeline` + `[components]` blocks, download `config.cfg`.   |
| `api-add-pipe`       | `/api/language#add_pipe`                | `snippet` | Minimal single-call builder for `add_pipe` arguments (`before`/`after`/`first`/`last`, `source`, …). |

Each MDX location contains a `{/* BLOCKLY-PIPELINE-BUILDER ... */}` comment
next to the component with the location-specific configuration notes.

## Remaining work to replace the placeholder

1. Add dependencies to `website/package.json`: `blockly` (and optionally
   `react-blockly`, or mount Blockly manually via `Blockly.inject` in a
   `useEffect` with cleanup via `workspace.dispose()`).
2. Define custom blocks + toolbox in `src/widgets/blockly/blocks.js`:
   pipeline container block, component blocks (one per built-in factory),
   placement fields (`before`/`after`/`first`/`last`), `disable`/`exclude`
   mutators, `source=` inputs for sourced components.
3. Implement generators in `src/widgets/blockly/generators.js`: Python
   (`spacy.blank`/`spacy.load` + `add_pipe` calls) and `config.cfg` (INI)
   output. Reuse `Code`/`CodeBlock` components for syntax highlighting and
   the copy-to-clipboard behavior used by the quickstart widgets.
4. Wire the `mode` handling in `builder.js` (toolbox filtering, read-only
   tour mode, output pane format) from the preset entries in `presets.js`.
5. Keep the component client-only: all Blockly imports must stay inside
   `builder.js` (loaded via `next/dynamic`), never in `remark.js` or page
   modules.
