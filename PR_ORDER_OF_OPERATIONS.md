# Order of operations for the open pull requests

A recommended sequencing for the five open PRs on this fork and for the work
each one plans but does not complete. All five PRs target `master`, touch
**disjoint paths**, and therefore merge conflict-free in any order — the
ordering below is about the *follow-on work*, not about mechanical
mergeability.

## The open PRs at a glance

| PR | Content | State | Planned-but-incomplete work it carries |
|----|---------|-------|----------------------------------------|
| [#1](https://github.com/mmusa-russ-fugal/spaCy/pull/1) | `levelset-best-practices/` — spaCy architecture study distilled into design guidance for the levelset toolkit | Complete, standalone | None in this repo (its checklist items belong to the external levelset project) |
| [#2](https://github.com/mmusa-russ-fugal/spaCy/pull/2) | `pipeline-composer/` — standalone Vite/React/TypeScript app with a real Blockly editor, Python/config codegen, vitest + pytest coverage, local-server and Pyodide execution engines | Complete, standalone, tested | None; README notes engine limitations only (Pyodide: blank pipelines, no ja/ko/th) |
| [#3](https://github.com/mmusa-russ-fugal/spaCy/pull/3) | `website/NEXTJS_MIGRATION_PLAN.md` — phased plan for Next.js 13.0.2 → 16.2.x | Complete as a document | **All of it**: executing Phases 0–6 of the migration |
| [#4](https://github.com/mmusa-russ-fugal/spaCy/pull/4) | Website Blockly pipeline-builder widget: functional **placeholder** workspace (`SimpleWorkspace`), four MDX embeds, `remark.js` registration, presets/generators/chrome | Functional placeholder | Swap in the real Blockly editor (`src/widgets/blockly/README.md` steps 1–4: add `blockly` dependency, implement `BlocklyWorkspace`, swap the seam in `builder.js`) |
| [#5](https://github.com/mmusa-russ-fugal/spaCy/pull/5) | `website/src/types/` — central type-only `.ts` definitions for the website; nothing imports them yet | Complete, additive | The JS → TSX conversion of `website/src` these types were written to support |

## Key interactions that drive the order

1. **PR #3's migration is the foundation everything website-side sits on.**
   Its Phase 3 (React 19 + MDX v3 + `next-mdx-remote` v5) churns exactly the
   surface PR #4 registered into (`src/remark.js`, MDX embeds), and Phase 4's
   bundler decision (webpack vs. Turbopack) affects how a heavy dependency
   like `blockly` gets bundled.
2. **PR #2 is the reference implementation for PR #4's remaining work.** Its
   `src/blockly/blocks.ts`, `theme.ts`, `toolbox.ts`, code generators, and
   `scripts/generate_component_meta.py` (FactoryMeta → JSON) are exactly what
   the website's `BlocklyWorkspace` needs. Porting beats rewriting — and the
   meta-generation script can replace PR #4's hand-maintained `components.js`
   so the two builders share one source of truth.
3. **PR #5's `.tsx` conversion should not race the Next.js migration.**
   Converting components the migration is about to touch means churning the
   same files twice. The type definitions themselves are inert and safe to
   merge immediately, but they describe the current Next-13-era shapes and
   must be kept in sync as the migration lands.

## Recommended order

### Stage 1 — merge everything that is done and independent (any order, now)

- **PR #1** — docs only, zero coupling to anything else.
- **PR #2** — standalone app; merging it also unblocks Stage 3, which ports
  from it.
- **PR #3** — a plan document; merging makes it the shared reference.
  Merging the plan ≠ executing the migration.
- **PR #5** — type-only, nothing imports it yet.
- **PR #4** — the placeholder is plain React, already verified against the
  site's remark plugins. Merging it *before* the migration means every
  migration phase is validated against the widget, instead of the widget
  breaking silently on a later rebase.

### Stage 2 — execute the Next.js migration (PR #3's plan), Phases 0–4 in order

- **Phases 0–1**: toolchain baseline (Node 22, Python 3.12), `output:
  'export'`, remove `next-pwa` with the service-worker kill switch, drop dead
  dependencies. The current pins are EOL — this is the most time-sensitive
  work in the queue.
- **Phase 2**: Next 14.2 checkpoint.
- **Phase 3**: React 19 + MDX v3 + `next-mdx-remote` v5 + Next 15.5. **Re-verify
  the four PR #4 widget embeds and the `remark.js` registration here** — this
  phase touches the exact seam the widget plugs into.
- **Phase 4**: Next 16.2 (webpack-first) + ESLint 9 flat config.

### Stage 3 — Blockly editor swap (PR #4's remaining work), after Phases 3–4

- Add the `blockly` dependency once, against the final React 19 / Next 16
  toolchain, with the bundler decision already settled.
- Implement `BlocklyWorkspace` honoring the existing
  `({ state, setState, preset })` contract, porting block definitions, theme,
  and generators from `pipeline-composer/` (PR #2).
- Adopt `pipeline-composer/scripts/generate_component_meta.py` output to back
  the website widget's component metadata, replacing the hand-maintained
  `components.js` (single source of truth, no drift between the two builders).

### Stage 4 — incremental JS → TSX conversion of `website/src` (PR #5's follow-up)

Component-by-component, after the toolchain is stable. Doing it earlier would
double-churn files the migration touches; TypeScript tooling is also in better
shape on Next 15/16.

### Stage 5 — optional tail

- Migration Phase 5 (Serwist PWA) — only if a PWA is still wanted; otherwise
  keep the kill-switch service worker deployed for 6–12 months per the plan.
- Phase 6 follow-ups (e.g. the pinned `@jupyterlab/services` Juniper widget).

## The one real sequencing decision

Ship the Blockly editor swap **after** the migration rather than before it.
Doing the migration first means its riskiest phases (3–4) carry no new heavy
dependency, and `blockly` is integrated once instead of being re-validated
through four toolchain bumps. The cost — the interactive editor ships later —
is covered by PR #4's placeholder widget, which keeps the four docs pages
functional in the interim.
