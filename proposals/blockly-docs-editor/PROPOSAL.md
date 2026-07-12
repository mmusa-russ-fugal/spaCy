# Feature proposal: an interactive "blocky" pipeline builder in the spaCy docs

**Status:** draft for discussion · **Target:** [spacy.io](https://spacy.io) documentation site · **Type:** website / docs feature (no changes to the `spacy` Python package)

---

## 1. Summary

Add an interactive, **block-based pipeline builder** to the spaCy documentation.
Readers drag component blocks (`tok2vec`, `tagger`, `parser`, `ner`, custom
components, …) into a pipeline and immediately see the corresponding
**runnable Python** (`spacy.blank()` / `spacy.load()` + `nlp.add_pipe(...)`) and,
where relevant, a matching **`config.cfg`** excerpt — all inline in the existing
docs pages, next to the prose that already explains these concepts.

It is built on [Blockly](https://developers.google.com/blockly) and follows the
site's existing interactive-widget conventions, so it slots into pages the same
way `QuickstartInstall` and `QuickstartTraining` already do.

## 2. The problem

spaCy's pipeline model — a tokenizer followed by an ordered list of components,
each declaring what it `requires`/`assigns`, some trained and some rule-based,
configurable from Python *or* from `config.cfg` — is one of the highest-value
concepts for a new user to internalize, and one of the most abstract to learn
from static prose.

Today a reader learning "how do I add a component before the parser?" or "what
does the `[components]` block in my config correspond to at runtime?" has to
mentally simulate the pipeline. The docs explain it well in text and diagrams,
but there is no way to *manipulate* a pipeline and watch the code change. The
gap is between **understanding the diagram** and **writing the right
`add_pipe`/config**.

## 3. The proposal

A single widget, embedded at a few carefully chosen locations, each in a mode
tuned to its surrounding prose:

| Docs location | Mode | What the reader does |
| --- | --- | --- |
| `/usage/spacy-101#pipelines` | **tour** (read-only) | Poke at the `en_core_web_sm` pipeline from the diagram just above it; see the Python it corresponds to. Links out to the full builder. |
| `/usage/processing-pipelines#pipelines` | **build** | Add / reorder / disable / source built-in components; get `spacy.load` + `add_pipe` Python. The primary home of the widget. |
| `/usage/training#config-components` | **config** | Compose the `[nlp] pipeline` and `[components]` blocks visually, choose factory vs. source vs. frozen, download a `config.cfg` excerpt. |
| `/api/language#add_pipe` | **snippet** | A single-call playground for the `add_pipe` arguments (`before`/`after`/`first`/`last`, `name=`, `source=`), with an inline hint when placement arguments conflict — mirroring the runtime validation. |

Design principles:

- **Meets the prose, doesn't replace it.** Each embed sits next to the section
  that already teaches the concept; the widget is an "editable figure," not a
  new tab or a separate app to context-switch into.
- **Generated code is the point.** The output is always real, copy-pasteable
  spaCy code that matches the surrounding examples — the widget teaches by
  showing the code your blocks produce.
- **One configuration surface.** Every embed passes only a `preset` id; all
  location-specific configuration (mode, toolbox, starting workspace, output
  format) lives in one `presets.js` file, so the MDX stays clean and adding a
  new location is a one-entry change.

## 4. Why this belongs in the docs (and why it's low-risk to the maintainers)

- **It touches only `website/`.** No new runtime dependency for the `spacy`
  package, no change to any public API. The blast radius is the docs site.
- **It follows an established pattern.** The site already ships client-side
  interactive widgets that "configure something, get a config/command out"
  (`quickstart-install.js`, `quickstart-training.js`). This is the same shape,
  registered the same way in `src/remark.js`, and used in MDX as a single
  component tag.
- **It degrades gracefully.** The editor is loaded via `next/dynamic` with
  `ssr: false` (Blockly needs the DOM), and the prototype ships a plain-React
  fallback workspace so the feature works — and the generated code renders —
  even before the Blockly canvas hydrates.
- **It's aligned with spaCy's inclusion philosophy.** `CONTRIBUTING.md` prefers
  a small core and self-contained additions. This adds nothing to the core; it
  is contained to the website and to one widget directory.

## 5. Evidence: the prototype already exists

This is not a "wouldn't it be nice" proposal. Two prototypes are already built
in this fork:

### 5a. Standalone composer (proof of the full experience) — PR #2

`pipeline-composer/`: a Vite + React + TypeScript + Tailwind app with a real
Blockly canvas and **three live outputs** — runnable Python, a minimal valid
`config.cfg`, and *live execution* on sample text with displaCy visualizations.
Notable details that show the concept is real, not cosmetic:

- The block palette for the 19 core built-in components is **generated from
  spaCy's own `FactoryMeta`** (`scripts/generate_component_meta.py` →
  `factory-meta.json`), so `requires`/`assigns` ordering warnings and
  "untrained component" hints come from spaCy itself, not a hand-maintained
  list that will drift.
- A neutral `PipelineSpec` drives every output; a vitest suite covers workspace
  traversal, codegen, validation, and metadata drift.
- Live execution runs either via a stdlib-only local server or an opt-in
  in-browser Pyodide engine, both sharing one `spacy_runner.py` (pytest-covered).

This is the artifact to **demo or screen-record** and attach to the Discussion.

### 5b. In-docs integration (proof it fits the site) — PR #4

The widget is wired into the actual docs site the way it would ship:

- `website/src/widgets/blockly-pipeline-builder.js` — the `next/dynamic`,
  `ssr: false` wrapper, registered in `src/remark.js`.
- `website/src/widgets/blockly/` — the builder split into editor-agnostic parts:
  `widget.js` (chrome: header, code pane with Prism highlighting, copy +
  download), `workspace.js` (a working plain-React `SimpleWorkspace`),
  `generators.js` (pure `state → Python`/`config.cfg`/snippet functions),
  `components.js` (built-in factory metadata), and `presets.js` (one entry per
  docs location).
- Embeds added to the four MDX pages above, each with a
  `{/* BLOCKLY-PIPELINE-BUILDER ... */}` note documenting its configuration.
- A `README.md` in the widget directory documenting the **single seam** to swap
  in the real Blockly canvas: implement a `BlocklyWorkspace` with the same
  `({ state, setState, preset })` contract and swap it in `builder.js` — the
  chrome, generators, and presets don't change.

In other words: the hard integration questions (SSR, styling, code
highlighting, where it lives on each page, how config stays out of MDX) are
already answered and reviewable.

## 6. Recommended path to recommend it

Grounded in spaCy's actual process (`CONTRIBUTING.md`, issue config):

1. **Open a GitHub Discussion in the *Ideas* category** — not an issue. Blank
   issues are disabled and feature ideas are explicitly routed to Discussions.
   Use [`DISCUSSION_POST.md`](./DISCUSSION_POST.md).
2. **Link a live demo.** Deploy the PR #2 composer (or a Netlify preview of the
   PR #4 branch — the site already has Netlify preview deploys wired up) and/or
   attach a short screen recording. Show, don't tell.
3. **Offer the integration PR, gauge appetite first.** For a site-architecture
   change, maintainers prefer to weigh in on direction before a large PR lands.
   Point at PR #4 as the reviewable integration and PR #2 as the full-fidelity
   reference, and ask whether they'd welcome it upstream.
4. **If yes, open the PR against `explosion/spaCy`** targeting `website/`, sign
   the [Contributor Agreement](https://github.com/explosion/spaCy/blob/master/.github/CONTRIBUTOR_AGREEMENT.md),
   and follow `website/README.md` for local build + preview.

## 7. Rollout & sequencing

The [`PR_ORDER_OF_OPERATIONS.md`](../../PR_ORDER_OF_OPERATIONS.md) (from PR #3)
already sequences this against the site's Next.js 13 → 16 migration and the
JS → TSX conversion. In short: land the migration groundwork, then swap the
`SimpleWorkspace` seam for the Blockly canvas, porting the block/codegen logic
proven in the standalone composer (PR #2). The widget is intentionally shippable
in stages — the plain-React workspace already generates correct code, so the
Blockly canvas is an enhancement, not a prerequisite.

## 8. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Blockly adds page weight | Loaded only via `next/dynamic` on the handful of pages that embed it; never in the SSR bundle. |
| Generated code drifting from spaCy's real behavior | Component metadata generated from spaCy's own `FactoryMeta`; codegen covered by tests. |
| Widget dominating the prose | Per-preset `height` caps and read-only "tour" mode keep embeds figure-sized. |
| Maintenance burden on a small team | Self-contained to one widget directory; degrades to a static fallback; no core dependency. |
| Accessibility of a drag-and-drop editor | Fallback plain-React workspace uses standard form controls; keep it as the no-JS / reduced-motion path. |

## 9. What we're asking for

A decision from the maintainers on **whether an interactive pipeline builder
belongs in the spaCy docs**, and if so, the **preferred shape** (which pages,
how prominent, Blockly vs. a lighter custom canvas). Everything downstream of
that — the integration PR, the migration sequencing — is already prototyped and
ready to adapt to their answer.
