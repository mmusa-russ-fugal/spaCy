# Demo script: blocky pipeline builder

A ~3-minute walkthrough for demoing the prototype live or recording a screen
capture to attach to the Discussion post. The goal is to show the "manipulate a
pipeline, watch the real code change" loop as fast as possible.

The composer is hosted live at <https://spacy.fugl.dev> — for most audiences,
just open that and skip straight to [The walkthrough](#the-walkthrough). The
local setup below is for running against uncommitted changes or a specific
branch.

## Setup

**Option A — standalone composer (PR #2, full fidelity):**

```bash
cd pipeline-composer
npm install
npm run dev
```

Open the printed local URL. For the live-execution panel, either start the local
runner (`python server/run_server.py`) or enable the in-browser Pyodide engine
from the UI.

**Option B — in the real docs site (PR #4, in-context):**

Follow `website/README.md` setup, run the site locally, and open
`/usage/processing-pipelines#pipelines`. Note: PR #4 ships the plain-React
fallback workspace, so this shows the *integration and generated code* in place;
the Blockly canvas is the swap-in described in the widget `README.md`.

## The walkthrough

1. **Start from the concept.** Open the builder next to the pipeline diagram it
   mirrors. "This is the `en_core_web_sm` pipeline you just read about — but you
   can edit it."

2. **Add a component.** Drag `entity_ruler` in before `ner`. Point at the Python
   pane updating live to the matching `nlp.add_pipe("entity_ruler", before="ner")`.
   *The generated code is real and copy-pasteable — that's the whole point.*

3. **Reorder / disable.** Move a component; disable one. Show `pipe_names` and
   the `disable_pipe` call updating. Mention the ordering warning surfaces when
   `requires`/`assigns` are violated — and that those come from spaCy's own
   `FactoryMeta`, not a hand-maintained list.

4. **Switch to config.** On the training-mode embed, flip a component from
   factory to `source`, freeze another, and download the `config.cfg` excerpt.
   Show that it matches the `[components]` block in the docs example right below.

5. **(Composer only) Run it.** Type a sentence, run, and show the live displaCy
   entities/deps for the pipeline you just built.

6. **Close on the integration.** Show that in the docs it's a single MDX tag
   (`<BlocklyPipelineBuilder preset="..." />`) and that all config lives in one
   `presets.js` — i.e. it's cheap to place and cheap to maintain.

## Talking points to land

- Touches only `website/`; no `spacy` package dependency or API change.
- Same widget pattern the site already uses (`QuickstartTraining`).
- Degrades gracefully: `next/dynamic` + `ssr: false`, plain-React fallback.
- Component metadata generated from spaCy itself, so it won't silently drift.
