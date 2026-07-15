# Website Migration Log

Running log of the `website/` Next.js migration (13.0.2 → 16.2.x). Each phase
appends one entry below, newest last. See `NEXTJS_MIGRATION_PLAN.md` for the
full 6-phase plan.

Entry format: **What changed**, **How to verify**, **Rollback**.

---

## Phase 0 — Toolchain baseline (Node 22 LTS + Python 3.12)

Branch: `migration/phase-0-toolchain`

Toolchain version pins, plus the one source fix required to make the existing
build green on the newly-pinned Node 22. This phase establishes the Node/Python
versions that every later phase builds on (Next 16 requires Node ≥ 20.9; Node 20
is EOL Apr 2026, so we target Node 22 LTS). The Python 3.12 pin also preps for
later Python-based tooling. The rendered HTML output (`website/out/`) is
equivalent to before — the source fix only changes *how* `meta/site.json` is
loaded, not its values. Build artifacts are not byte-for-byte identical: the
site config now reaches the client bundle through a generated JS module instead
of an inlined webpack JSON module, so chunk contents/hashes under
`website/out/_next/` differ even though rendered pages match.

### What changed

- **`website/.nvmrc`**: `18` → `22`. Pins the Node major for `nvm`/CI. Kept as a
  bare major (`22`) so it tracks the latest 22.x LTS patch, matching the existing
  convention.
- **`website/package.json`**: replaced the nonstandard `"engine": 18` field with
  a valid `"engines": { "node": ">=22.0.0" }`. `"engine"` (singular) was never a
  real npm field and did nothing; `"engines"` is the standard key. Floor is
  Node 22.0.0 (Node 22 LTS) rather than an exact-major lock, so newer LTS majors
  in CI are not artificially blocked.
- **`website/runtime.txt`**: `3.8` → `3.12`. Pins the Python runtime (used by the
  quickstart training-config prebuild, `setup/setup.sh` → `setup/jinja_to_js.py`,
  and by Netlify). `3.9`–`3.14` are all in-range for the repo's `python_requires`
  in `setup.cfg`.
- **`website/Dockerfile`**: base image `node:18` → `python:3.12-bookworm` with
  Node 22 LTS layered on via NodeSource. The old image had no Python, so it could
  not run the full `npm run build` (whose prebuild shells out to `pip`/`python`);
  the new image carries both toolchains at their pinned versions. The original
  non-root `node` user and the "node_modules one directory up" mount trick are
  preserved (the `python:` base ships no unprivileged user, so one is created).

**Required Node 22 compatibility fix (JSON import interop).** Node 22 removed the
`import ... assert { type: 'json' }` attribute syntax (replaced by `with`), so the
pre-existing `meta/dynamicMeta.mjs` broke the build under Node 22. This module is
uniquely loaded by *both* raw Node (`next.config.mjs` via the remark-plugin chain,
and `next-sitemap.config.mjs`) *and* the browser bundle (the remark plugins run
client-side via `src/components/markdownToReact.js`). No single JSON import-
attribute works in both: Node 22 rejects `assert`, and Next 13's SWC parser
rejects `with`; `createRequire`/`fs` fall over in the browser bundle (`module`
builtin unresolvable). The fix routes `dynamicMeta.mjs` through a plain-JS mirror
of `site.json` — valid everywhere, no attribute needed:

- **`website/setup/generateSiteModule.mjs`** (new): generates
  `meta/site.generated.mjs` (`export default { …site.json… }`) from `meta/site.json`.
- **`website/setup/setup.sh`**: runs the generator during prebuild, alongside the
  existing quickstart codegen.
- **`website/meta/dynamicMeta.mjs`**: imports `./site.generated.mjs` instead of
  `./site.json`. `site.json` remains the single source of truth; the ~10 other
  webpack-only importers of `site.json` are unaffected.
- **`website/.gitignore`**: ignores the generated `meta/site.generated.mjs`
  (same pattern as the existing `quickstart-training-generator.js`).

**Follow-up (temporary indirection).** The generated-module mirror is only
needed because Next 13.0.2's SWC parser doesn't yet accept `with { type: 'json' }`.
Once a later phase upgrades to Next 14+ (Track B.6/B.7), SWC will support `with`,
and `meta/dynamicMeta.mjs` should switch back to importing `meta/site.json`
directly via `import site from './site.json' with { type: 'json' }`, at which
point `setup/generateSiteModule.mjs`, its `setup.sh` invocation, and the
`meta/site.generated.mjs` gitignore entry can all be deleted.

### How to verify

Confirm the toolchain and a clean build (verified on Node v22.22.3 /
Python 3.12.1):

```bash
cd website
node -v            # v22.x (matches .nvmrc)
python3 --version  # Python 3.12.x (matches runtime.txt)
npm ci
npm run build      # prebuild (pip install + setup.sh, regenerates the quickstart
                   # generator AND meta/site.generated.mjs) then next build +
                   # sitemap + export
```

Verified result: `Export successful`, `website/out/` populated with `index.html`,
`sitemap.xml`, `robots.txt` and 319 HTML pages. The remark `%%…%%` replacements
(which flow through `dynamicMeta.mjs` → `site.generated.mjs`) resolve correctly
in the output (0 leftover tokens; e.g. `github.com/explosion/spaCy/tree/master`
present), and the site config reaches the client bundle — confirming the
generated-JS-module path is browser-safe.

Docker image (optional, builds Node 22 + Python 3.12 toolchain):

```bash
cd website
docker build -t spacy-website-toolchain .
```

### Known risks

- **Netlify build image / `runtime.txt` 3.8 → 3.12.** `website/netlify.toml`
  publishes `website/out`, and `runtime.txt` is Netlify's Python version pin.
  Whether Netlify's build image accepts Python 3.12 via `runtime.txt` (older
  images only accept 3.8) can't be verified from the repo alone — confirm with
  a Netlify deploy preview before merging this to production.

### Rollback

Revert this phase's commits on `migration/phase-0-toolchain`, or drop the branch
entirely. The change is fully contained in the pin files (`.nvmrc`,
`package.json`, `runtime.txt`, `Dockerfile`) and the JSON-interop fix
(`meta/dynamicMeta.mjs`, `setup/generateSiteModule.mjs`, `setup/setup.sh`,
`.gitignore`) — no lockfile edits and no committed generated artifacts
(`meta/site.generated.mjs` is gitignored). `git revert <commit>` cleanly restores
Node 18 / Python 3.8 and the original `assert`-based JSON import. Note: reverting
the interop fix without also reverting the Node pin re-breaks the build on Node 22.

---

## Phase 1 — Build-pipeline modernization on Next 13.5.x

Branch: `migration/phase-1-build-pipeline`

Eliminates the two build-pipeline blockers for the later major-version bumps
*before* any major bump: the standalone `next export` command (removed in
Next 14) and `next-pwa` v5 (unmaintained, incompatible with newer Next). Also
drops dead-weight dependencies. Still on Next 13.x — rendered output is
unchanged (319 HTML pages, identical file list to the Phase 0 baseline).

### What changed

**1. Static export via `output: 'export'`** (replaces `next export`):

- **`website/package.json`**: `next` and `eslint-config-next` `13.0.2` →
  `13.5.11`, `@next/mdx` `^13.0.2` → `^13.5.11` (the `output: 'export'` config
  option needs Next ≥ 13.3; 13.5.11 is the last 13.x release). `next-sitemap`
  `^3.1.32` → `^4.2.3`. The `build` script drops the trailing `next export`
  step: `next build && npm run sitemap` — the export into `out/` now happens
  inside `next build` itself.
- **`website/next.config.mjs`**: added `output: 'export'`.
- **`website/next-sitemap.config.mjs`**: added `outDir: 'out'`. The sitemap
  step now runs *after* the export, so it must write `sitemap.xml`,
  `sitemap-0.xml` and `robots.txt` straight into the published `out/` dir
  (next-sitemap's default `outDir` is `public/`, which was only correct when
  `next export` copied `public/` into `out/` afterwards).

**2. next-pwa removal + service-worker kill switch**:

- **`website/next.config.mjs`**: removed the `withPWA(...)` wrapper and the
  `next-pwa` import; **`website/package.json`**: removed the `next-pwa`
  dependency.
- **`website/public/sw.js`** (new, committed): a kill-switch service worker at
  the exact URL the old next-pwa worker was registered from. On `install` it
  calls `skipWaiting()`; on `activate` it deletes ALL caches, unregisters
  itself, and reloads every open client. Production visitors have the old
  Workbox worker installed; without this file at `/sw.js` their browsers would
  keep serving stale precached content indefinitely.
- **`website/.gitignore`**: removed the `public/sw.js*` and `public/workbox*`
  ignore entries — `sw.js` is now a committed source file, and nothing
  generates Workbox artifacts anymore.
- `manifest.webmanifest` and the `<link rel="manifest">` in `pages/_app.tsx`
  are intentionally kept — the site remains installable; only the offline
  caching layer is removed.

**DEPLOY NOTE (critical):** the kill-switch `public/sw.js` MUST ship in the
same commit/deploy as the next-pwa removal — deploying the removal without it
strands returning visitors on the old worker's stale cache forever.
**Retention rule:** keep the kill switch deployed for **6–12 months minimum**
(late-returning visitors only fetch it when they come back), unless the later
Serwist phase (Phase 5) replaces it with a real service worker at the same
`/sw.js` URL. Do not delete it early. Also note: rolling back a production
deploy *across* this phase re-registers the old next-pwa worker in visitors'
browsers — when rolling forward again, the kill switch must ship again.

**3. Dead-weight dependency removal**:

- **`website/package.json`**: dropped `remark` and `remark-react` — zero
  imports anywhere in the site source (verified by grep; the `remark-gfm` /
  `remark-smartypants` / `remark-unwrap-images` plugins are separate packages
  and stay). `node-fetch` and `ws` are **kept** even though nothing in the
  site source imports them: `@jupyterlab/services@3`'s `serverconnection.js`
  does `eval('require')('node-fetch')` / `eval('require')('ws')` whenever it
  loads outside a browser but does not declare either as a dependency —
  they are host-provided. Next's prerender workers load that module for the
  pages that bundle Juniper (`/`, `/404`, `/universe/*`), so removing
  `node-fetch` breaks `next build` ("Cannot find module 'node-fetch'" during
  prerendering; the require runs before the `global.fetch` fallback, so
  Node 22's built-in fetch does not help).
- Replaced `browser-monads` (unmaintained SSR `window`/`document` shims) in
  its 8 consumer files, then dropped the dependency:
  - Import-only removals — every use is inside `useEffect`, an event handler,
    or a method only reachable client-side, where the real globals are always
    available: `pages/404.js`, `src/components/section.js`,
    `src/components/sidebar.js`, `src/components/juniper.js`,
    `src/widgets/changelog.js`, `src/templates/models.js`.
  - `src/components/quickstart.js`: import removed; the existing
    `typeof window !== 'undefined'` (`isClient`) check already short-circuits
    the one render-time `document` access.
  - `src/components/progress.js`: `getOffset()`/`getScrollY()` are called
    during render (initial `useState` values), so they now start with explicit
    `typeof document/window === 'undefined'` guards returning the same inert
    defaults the shim produced (`{ height: 0, vh: 0 }` / `0`).

### How to verify

```bash
cd website
npm ci
npm run build   # prebuild → next build (exports into out/) → next-sitemap
```

Verified result (Node v22.22.2): build green; `out/` contains the same 319
HTML pages as the Phase 0 baseline (`find out -name '*.html' | sort` — file
lists diff clean, no URL-shape regressions); `out/sitemap.xml`,
`out/sitemap-0.xml` and `out/robots.txt` present; `out/sw.js` is the kill
switch; no `workbox-*.js` or other next-pwa artifacts in `out/` or `public/`;
no `browser-monads` / `next-pwa` / `withPWA` / `next export` references left
in source; spot-checked `out/index.html`, `out/usage/spacy-101.html`,
`out/models/en.html`, `out/api/doc.html`, `out/universe.html` and the 404
page for non-empty rendered content.

Note for local builds: if you previously built this site pre-Phase-1, delete
stale generated files from `public/` (`sw.js`, `workbox-*.js`, `sitemap*`,
`robots.txt`) — they are no longer gitignored (sw.js) or no longer written
there (sitemap/robots), and leftovers would be copied into `out/`.

### Rollback

`git revert` of this phase's commits restores Next 13.0.2, `next export`, and
next-pwa. Safe locally. For **production**, see the deploy note above: any
rollback across this phase re-installs the old service worker in visitors'
browsers, so the roll-forward that follows must ship the kill-switch `sw.js`
again (it is committed, so a plain roll-forward does this automatically).

---

## Phase 2 — Next 14.2.x checkpoint

Branch: `migration/phase-2-next14`

Major-version bump Next 13.5.11 → 14.2.35 (latest 14.2 patch). By design this
is a near-zero-code-change checkpoint: the only Next-14 breaking change that
affects this site — removal of the standalone `next export` command — was
pre-solved in Phase 1 (`output: 'export'`), so no source or config edits were
needed. React stays 18.2.0, MDX stays v2, `next-mdx-remote` stays 4.2.0, and
the inert `experimental.mdxRs` block in `next.config.mjs` stays — all of those
are Phase 3 scope. Rendered output is unchanged: same 319 HTML pages, file
list identical to the Phase 1 baseline.

### What changed

- **`website/package.json`**: `next` `13.5.11` → `^14.2.35`,
  `eslint-config-next` `13.5.11` → `^14.2.35`, `@next/mdx` `^13.5.11` →
  `^14.2.35`. All three move in lockstep, as before.
- **`website/package.json`**: `next-plausible` `^3.6.5` → `^3.12.5`. This is
  the one peer-dep adaptation Next 14 required: `next-plausible@3.6.5`
  declares `peer next@"^11.1.0 || ^12.0.0 || ^13.0.0"`, so `npm ci` fails
  with `ERESOLVE` against next 14. `3.12.5` widens the peer range to
  next ^11–^16 (covering the rest of the migration). The floor is raised in
  `package.json` (not just the lockfile) so a future re-resolve can't slide
  back below Next-14 peer support. The site's only usage —
  `<PlausibleProvider domain={domain} enabled>` in `pages/_app.tsx` — is
  unchanged API across 3.x; no code change.
- **`website/package-lock.json`**: regenerated for the above.
- No changes to `next.config.mjs`: `output: 'export'`, `swcMinify`,
  `images.unoptimized` and the MDX options are all still valid Next 14
  config (no schema complaints in the build output).

### How to verify

```bash
cd website
npm ci
npm run build   # prebuild → next build (Next 14.2.35, exports into out/) → next-sitemap
```

Verified result (Node v22.22.2): build green — `✓ Compiled successfully`,
`✓ Generating static pages (320/320)`, sitemap step runs. `out/` contains the
same 319 HTML pages as the Phase 1 baseline (`find out -name '*.html' | sort`
diffs clean against the Phase 1 file list). `out/sitemap.xml`,
`out/sitemap-0.xml`, `out/robots.txt` present; `out/sw.js` is still the
Phase 1 kill switch; no workbox artifacts. Spot checks: `out/index.html`
contains the benchmarks-section content, `out/usage/spacy-101.html` contains
its imported 101-partial content (e.g. the pipeline-101 "When you call `nlp`
on a text" passage), `out/api/doc.html` and `out/universe/project/*.html`
non-empty, zero leftover `%%…%%` tokens.

Warning delta vs Phase 1 (nothing actionable):

- Pre-existing and unchanged: the 2 "Invalid href" warnings from malformed
  universe/API data URLs, and the "data … exceeds 128 kB" warnings for
  `/api/architectures` and `/api/cli`.
- The *third* large-page-data warning moved from `/api/language` to
  `/api/large-language-models` — both sit at the 128 kB threshold boundary
  and Next 14 serializes page data slightly differently; cosmetic.
- The Phase 1 `⚠ Invalid next.config.mjs options detected:
  "env.DOCSEARCH_API_KEY" is missing, expected string` warning (when the env
  var is unset) is gone — Next 14's config schema no longer flags it.
- The `sharp` recommendation warning remains (images are `unoptimized`, so
  it's moot for this static export).

### Rollback

`git revert` of this phase's two commits restores Next 13.5.11 and
`next-plausible`'s `^3.6.5` floor (lockfile included). No source files
changed, so rollback is dependency-only and safe locally and in production —
rendered output is identical on both sides of this phase.
