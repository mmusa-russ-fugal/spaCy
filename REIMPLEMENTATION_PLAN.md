# spaCy fork: re-implement the Next.js migration + Blockly feature work as atomic branches/PRs — REVISED (migration-first)

> **Revision note (2026-07-15).** Rewritten per direction: the **Next.js 13 → 16
> migration spine runs first**, then the **JS → TSX conversion** on the new tooling
> (latest-stable TypeScript with `strict: true`, ESLint 9 flat config, Prettier 3),
> and only then everything else (Blockly widget/editor work, demo-deploy wiring).
> The previous revision started the feature branches first and folded the widget
> placeholder into migration Phase 1 — that ordering is superseded.
>
> PRs #7–#11, opened in the first orchestration round (session `merge-batch-prs`),
> are **kept, not deleted**; each is slotted into the new order below. The original
> PRs #1–#6 also stay open as design references — **no automatic closing**.

## Context

The fork `mmusa-russ-fugal/spaCy` has 6 original PRs from prior AI sessions. In-scope
work is the **core migration + feature threads** (the two pure documentation PRs —
#1 `levelset-best-practices/` and #6 `proposals/blockly-docs-editor/` — are out of
scope for re-implementation; their content stays readable from their branches via
`git show` for cross-reference):

| PR | Content | State |
|----|---------|-------|
| #2 | `pipeline-composer/` — standalone Vite/React/TS Blockly app (19 blocks, Python/config.cfg codegen, local-server + Pyodide execution, vitest+pytest) | Complete, standalone |
| #3 | `website/NEXTJS_MIGRATION_PLAN.md` — Next.js 13.0.2 → 16.2.x plan, 6 phases | **Plan only — nothing implemented** |
| #4 | Website Blockly widget: functional **placeholder**, 4 MDX embeds, `remark.js` registration | Placeholder, real editor not wired |
| #5 | `website/src/types/*.ts` — type-only definitions | Complete, but **nothing imports them yet** |

None of these PRs' commits can be reused directly: authorship must be
**"Russ T. Fugal <noreply@fugl.dev>" with no co-author trailer**, so every unit is a
**fresh re-implementation** by an Opus sub-agent in its own git worktree, using the
existing PR branches purely as design reference (fetched: `origin/claude/*`).
This session is the orchestrator only — it does not write code or run builds itself.

Standing directives:
- Toolchain caps: latest stable TypeScript, latest Prettier (3.x), **ESLint 9.x, not 10**
  (Next.js doesn't support 10 yet).
- `tsconfig` `strict: true` lands with the TSX-conversion stage, which starts as soon
  as the Next 16 toolchain (migration Phase 4) is merged.
- Every critical migration-step commit carries deploy/verification instructions, either
  in the commit message body or in a running `website/MIGRATION_LOG.md` (one entry
  appended per phase).
- Demo deploy target: `~/code/personal/fugl.dev/spacy` (new directory, **not** a git
  repo — matches the sibling wrangler-project dirs there). Static `wrangler.jsonc` with
  a `custom_domain` route (`spacy.fugl.dev`). Docker only packages `pipeline-composer`'s
  optional local run-server as an opt-in companion; the docs site stays fully static.
  **No deployment is executed** — setup only.
- Tests are in scope everywhere:
  - **`CONTRIBUTING.md`** (this repo) for anything Python (`pipeline-composer/runner/`,
    `server/`, `scripts/generate_component_meta.py`): `black` + `flake8` clean, tests
    co-located mirroring the module, descriptive names, one behavior per test,
    `parametrize` over hand-duplicated cases, `@pytest.mark.slow` for anything
    long-running, avoid unnecessary imports.
  - **`~/code/sks/sigma-ralph-grindset/policies/testing-philosophy/POLICY.md`** for
    TypeScript/React: don't test what `strict: true` already guarantees; DO test
    type-system boundaries (`as`/`any`/`unknown` casts, `JSON.parse` of Blockly
    workspace state, `FactoryMeta` JSON loading, Pyodide bridge results, MDX
    frontmatter) and pure string/data-transform functions (`pygen.ts`, `cfggen.ts`,
    `validate.ts` ordering logic); NO snapshot/render-output tests for React
    components; don't chase coverage; co-locate unit tests as `*.test.ts(x)` next to
    the source file.

## Current PR state (as of 2026-07-15, end of round 1)

| PR | Branch | Round-1 status | Slot in the new order |
|----|--------|----------------|-----------------------|
| #7 | `chore/demo-deploy-notes` | Clean, reviewed | Merge anytime (formally Stage 4) |
| #8 | `feature/blockly-widget-placeholder` | Clean, reviewed, re-reviewed; **held back** (was to merge into phase-1) | **Do not merge.** Kept open as spec/reference for Stage 3's TSX editor unit; decide rebase-vs-supersede there |
| #9 | `feature/website-types` | Clean, reviewed, fixed, re-reviewed | Merges at the **top of Stage 2**, after re-validation against the migrated codebase |
| #10 | `migration/phase-0-toolchain` | Clean, reviewed, fixed | **Stage 1, unit 1 — merge first** |
| #11 | `feature/pipeline-composer` | Clean, reviewed, two fix passes, re-reviewed | Disjoint standalone dir — safe to merge anytime (recommended: with #10, it's done and can't conflict); its *dependent* website work waits for Stage 3 |

Originals #1–#6: leave open, untouched, as design references. When a replacement unit
merges, comment on the corresponding original with a link, but **leave the close
decision manual** — they may still be reusable.

## Stage 1 — Next.js migration spine to 16 (strictly sequential; runs FIRST)

One branch per phase, each off the updated `master` after the prior phase's PR merges
(regular merge, not squash). Each phase appends a `website/MIGRATION_LOG.md` entry
with build/verify/rollback steps.

1. `migration/phase-0-toolchain` — **already open as PR #10; merge it.** Node 22 LTS,
   Python 3.12: `.nvmrc`, `Dockerfile`, `package.json` engines, `runtime.txt`.
2. `migration/phase-1-build-pipeline` (off merged phase-0) — `output: 'export'`, drop
   `next export`; remove `next-pwa` + ship SW kill-switch; drop dead deps
   (`remark`/`remark-react`/`node-fetch`); replace `browser-monads` with
   `typeof window !== 'undefined'` guards.
   **Changed from round 1: no widget-placeholder integration here** — under this
   ordering no Blockly widget exists on `master` during the migration.
   Also commit `website/public/_headers` here (Cloudflare-style headers file, copied
   into `out/` by the export) so the demo scaffold's `/sw.js` + global security
   headers ship with every build instead of being hand-copied (see
   `~/code/personal/fugl.dev/spacy/HANDOFF.md`).
3. `migration/phase-2-next14` (off phase-1) — Next 14.2.x checkpoint.
4. `migration/phase-3-react19-mdx3-next15` (off phase-2) — the interlocked bump:
   React 19, MDX v3, `next-mdx-remote` v5, Next 15.5. Audit the 4 custom remark
   plugins. (Blockly-embed re-verification moves to Stage 3 — the seam audit here
   should still confirm the `remark.js` registration point PR #8 documented survives.)
5. `migration/phase-4-next16-tooling` (off phase-3) — Next 16.2, webpack-first
   (+ optional Turbopack commit), **ESLint 9 flat config (9.x cap)**, Netlify config
   cleanup, **latest-stable TypeScript + Prettier 3**. **Merging this PR is the gate
   that opens Stage 2.**
6. `migration/phase-5-pwa-serwist` (off phase-4) — Serwist PWA behind the documented
   swappable seam, replacing the Phase-1 kill switch. Disjoint from `website/src`
   conversion work, so it **may run in parallel with Stage 2** rather than blocking it.

   **DECIDED (2026-07-15): the PWA ships, using `@serwist/next` per
   <https://serwist.pages.dev/docs/next/getting-started>** (see also the Next.js PWA
   guide, <https://nextjs.org/docs/app/guides/progressive-web-apps>). This resolves
   `PR_ORDER_OF_OPERATIONS.md`'s "only if a PWA is still wanted" question in the
   affirmative. Implementation notes for the phase-5 agent:
   - `npm i @serwist/next && npm i -D serwist`; wrap `next.config` with
     `withSerwist({ swSrc, swDest: 'public/sw.js', disable: dev })`.
   - **`@serwist/next` requires webpack** — this locks phase-4's webpack-first
     decision; the optional Turbopack commit must stay optional/secondary.
   - `swSrc` is a TypeScript worker source (Pages Router: e.g. `src/sw.ts`) using the
     `Serwist` class + `defaultCache` runtime caching; register
     `serwist.addEventListeners()`. Pages Router is supported; PWA metadata goes in
     `_app`/`_document`, manifest as a static `public/` file.
   - `tsconfig`: add `@serwist/next/typings` to `types`, `webworker` to `lib`,
     exclude the generated `public/sw.js`. Gitignore `public/sw*` and
     `public/swe-worker*`.
   - **Static-export caveat**: with `output: 'export'`, `headers()` in `next.config`
     does not apply — the `/sw.js` headers (`Cache-Control: no-cache, no-store,
     must-revalidate`, `Content-Type`, CSP) move to the hosting layer: a Cloudflare
     `_headers` file in the demo scaffold (Stage 4) and the Netlify config for the
     real site.
   - Scope: offline/runtime caching + installability (manifest, icons) only. **No
     web-push/VAPID** — a static docs site has no server to hold subscriptions, and
     static export precludes the guide's Server Actions approach.

## Stage 2 — JS → TSX conversion of `website/src` (~54 files; opens when Phase 4 merges)

7. Merge `feature/website-types` (**PR #9**) first — but re-validate before merging:
   the types were authored against Next-13-era shapes. Rebase onto post-migration
   `master` and update against the migrated code as fresh atomic commits.
8. `feature/tsx-conversion-core` — `tsconfig.json` `strict: true`, adopt
   `website/src/types/`, convert small leaf/util components first.
9. `feature/tsx-conversion-components` (off core) — bulk of `src/components/*` (~40 files).
10. `feature/tsx-conversion-widgets-templates` (off core, **parallel with 9** — disjoint
    dirs) — `src/widgets/*`, `src/templates/*`, `src/remark.js`.
    **Changed from round 1: the Blockly widget is no longer part of this unit** — it
    doesn't exist on `master` yet; it arrives in Stage 3 written in TypeScript from
    the start.

Verification: `tsc --noEmit` clean under `strict: true`; `npm run build` still green;
new tests (if any) target logic extracted during conversion, per the testing policy.

## Stage 3 — Blockly feature thread (after Stage 2)

11. `feature/pipeline-composer` (**PR #11**) merges **no later than here** (it is the
    porting reference); being fully disjoint (`pipeline-composer/` only), it may merge
    any time earlier without risk.
    **Post-merge follow-ups from the demo scaffold** (details in
    `~/code/personal/fugl.dev/spacy/HANDOFF.md`): `server/run_server.py` binds
    `127.0.0.1` only — add a `--host` option (`0.0.0.0` for Docker) so the demo
    container doesn't need `network_mode: host`; and its `ALLOWED_ORIGINS` is
    hardcoded to the Vite dev origin (`localhost:5173`) — add `https://spacy.fugl.dev`
    and `http://localhost:3000` so the docs-site widget can reach `/api/run`.
12. `feature/blockly-editor` — a **single unit replacing round 1's
    placeholder-then-swap pair**: implement the website widget directly in TSX against
    the final Next 16 / React 19 / strict-TS toolchain — real `BlocklyWorkspace`
    honoring the `({ state, setState, preset })` seam, block defs/theme/generators
    ported from `pipeline-composer`, the 4 MDX embeds, remark registration in the
    now-converted remark module, and `generate_component_meta.py` output as the shared
    metadata source (no hand-maintained `components.js`).
    Rationale: with the migration done first, the placeholder's interim value (keeping
    docs pages functional through the toolchain bumps) is gone — shipping
    placeholder-then-swap would churn the same seam twice. **PR #8 stays open as the
    spec/reference** for embed placement, presets, and widget chrome; on this unit's
    merge, decide whether #8 is closed as superseded or salvaged by rebase.

Verification: `npx vitest run`, `python -m pytest` (composer + `server/`); manual
compose-and-run smoke test on the 4 embed pages; console free of hydration errors.

## Stage 4 — demo deploy scaffolding

13. `chore/demo-deploy-notes` (**PR #7**) — docs only; merge anytime, formally slotted here.
14. (no PR — local scaffolding only) build `~/code/personal/fugl.dev/spacy/`:
    `wrangler.jsonc` (`custom_domain: spacy.fugl.dev`, static assets from
    `website/out`), `docker-compose.yml` + `Dockerfile` wrapping
    `pipeline-composer/server/run_server.py` as an opt-in companion service, and a
    `README.md` with manual deploy steps. Include a `_headers` file serving `/sw.js`
    with `Cache-Control: no-cache, no-store, must-revalidate` (+ `Content-Type`, CSP)
    per the phase-5 Serwist decision — static export can't set these from Next itself.
    Verify with `wrangler dev` (serves, does not publish) and `docker compose build`
    (builds, does not run/deploy). **After Stage 3**
    (needs `website/out` building and the composer run-server image).

## Orchestration mechanics (unchanged except ordering)

- **Worktrees & authorship**: all branches in dedicated worktrees under
  `../spacy-worktrees/<branch-name>`, one Opus sub-agent per worktree. Repo-level git
  config is already set (`user.name "Russ T. Fugal"`, `user.email "noreply@fugl.dev"`);
  every agent prompt explicitly forbids a `Co-Authored-By` trailer.
- **Concurrency**: Stage 1 is a strict chain — one agent at a time, each started only
  after the prior phase's PR is merged. Stage 2 opens when Phase 4 merges (Phase 5 may
  run parallel to Stage 2). Within Stage 2: unit 8 first, then 9 ∥ 10. Stage 3 after
  Stage 2 completes. Stage 4.13 anytime; 4.14 last.
- **Reuse of round-1 branches**: agents may rebase/rework the already-open branches
  (#8, #9) instead of re-implementing from scratch wherever that is cheaper — provided
  the resulting commits still satisfy the authorship rule.
- **Conflict resolution**: rare given disjoint paths, but the migration spine is
  sequential edits to the same files — a dedicated Opus agent is spawned with both
  sides' diffs and the phase context to resolve conflicts as its own commit.
- **Every agent's instructions include**: read the relevant existing PR branch(es) via
  `git show origin/<branch>:<path>` for spec/reference; work only in its assigned
  worktree; atomic, logically-scoped commits; run the relevant build/test/lint commands
  before finishing; append to `website/MIGRATION_LOG.md` for migration-spine phases;
  push and open a PR via `gh pr create`; never `--no-verify` or force-push.
- **Pre-PR code review gate**: before `gh pr create`, a **Fable** agent reviews the
  branch's full diff against `master` (correctness, reuse/simplification, efficiency).
  Findings route to a fix agent in the same worktree — **Opus** for architecture,
  cross-file contracts, or migration/codegen logic; **Sonnet** for mechanical/localized
  fixes — committing as its own atomic commit. Re-review only if the fix was
  non-trivial.
- **Merging**: after each PR passes verification, the orchestrator merges it to
  `master` (regular merge commit) to unblock dependents. Original PRs #1–#6 are
  **never auto-closed** — comment with a link to the replacement when one merges;
  closing is a manual decision.
- **No production deployment** at any point — only local demo scaffolding and
  verification that it builds/serves.

## Verification (per stage)

- Stage 1, per phase: `cd website && npm ci && npm run build`; diff `out/` HTML file
  list against the previous phase's baseline; `npm run dev` spot-check key pages
  (`/`, `/usage`, `/usage/spacy-101`, `/usage/training`, `/models/en`, `/universe`,
  `/api/doc`) with a headless browser, console free of hydration errors.
- Stage 2: `tsc --noEmit` clean under `strict: true`; `npm run build` green.
- Stage 3: `npx vitest run`, `python -m pytest server/`; compose-and-run smoke test;
  new tests target codegen/validation/parsing logic and JSON/type boundaries.
- Stage 4: `wrangler dev` serves `website/out` without error; `docker compose build`
  succeeds. Neither is published.
