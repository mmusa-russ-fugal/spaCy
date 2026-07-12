# Ready-to-paste GitHub Discussion (Ideas category)

> Paste the body below into a new Discussion at
> <https://github.com/explosion/spaCy/discussions> under the **Ideas** category.
> Replace the two `<link>` placeholders with a live demo URL and a link to the
> full proposal before posting. Keep it short — the demo does the convincing.

---

**Title:** Interactive "blocky" pipeline builder in the docs (drag components → get `add_pipe` / `config.cfg`)

**Category:** Ideas

---

### The idea

An interactive, block-based pipeline builder embedded directly in the docs.
You drag component blocks (`tok2vec`, `tagger`, `parser`, `ner`, custom
components, …) into a pipeline and immediately see the corresponding runnable
Python (`spacy.blank()` / `add_pipe(...)`) and a matching `config.cfg` excerpt —
right next to the prose that already teaches these concepts.

### Why

The pipeline model (ordered components, `requires`/`assigns`, factory vs.
sourced vs. frozen, Python vs. config) is one of the most valuable things for a
new user to internalize and one of the hardest to get from static text. Today
there's no way to *manipulate* a pipeline and watch the code change — the gap is
between understanding the diagram and writing the right `add_pipe`/config. An
"editable figure" closes it.

### What it looks like

A single widget, embedded in a few modes tuned to their pages:

- `/usage/spacy-101` — read-only **tour** of the `en_core_web_sm` pipeline
- `/usage/processing-pipelines` — full **builder**, generates `add_pipe` Python
- `/usage/training` — **config** mode, downloads a `config.cfg` excerpt
- `/api/language#add_pipe` — a **single-call** playground for the arguments

Built on Blockly, following the existing `src/widgets/` + `remark.js` widget
pattern (same shape as `QuickstartTraining`). It touches only `website/` — no
new dependency for the `spacy` package, no API change — and loads client-side
via `next/dynamic` (`ssr: false`) with a plain-React fallback.

### It's already prototyped

- **Live demo:** `<link to demo / screen recording>`
- A standalone composer (drag-and-drop → Python + `config.cfg` + live displaCy
  output) with the component palette generated from spaCy's own `FactoryMeta`,
  so ordering warnings come from spaCy itself.
- A working in-docs integration wired into the four pages above, built to the
  site's conventions, with a one-file seam to drop in the Blockly canvas.
- Full write-up (integration, rollout, risks, maintenance): `<link to proposal>`

### The ask

Does an interactive pipeline builder belong in the spaCy docs? If so, what shape
would you want (which pages, how prominent, Blockly vs. a lighter custom canvas)?
Happy to open a PR against `website/` — wanted to check appetite and direction
first.
