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

---

## Phase 3 — React 19 + MDX v3 + next-mdx-remote v5 + Next 15.5.x

Branch: `migration/phase-3-react19-mdx3-next15`

The interlocked big bump: Next 14.2.35 → 15.5.20, React 18.2.0 → 19.2.7,
MDX v2 → v3 (`@mdx-js/loader`/`@mdx-js/react` 2.1.5 → 3.1.1), and
`next-mdx-remote` 4.2.0 → 5.0.0. These move together — there is no green
intermediate state (next-mdx-remote 4 caps React at 18; MDX 3 requires the
v5 line; Next 15 wants React 19). Webpack remains the bundler (Turbopack is
Phase 4 scope). Rendered output: same 319 HTML pages, file list identical to
the Phase 2 baseline; a full-corpus normalized HTML diff was reviewed and
every change classified (see below) — no regressions.

### What changed

**Codemod.** `npx @next/codemod@latest upgrade 15` was run (it is
interactive; answers: upgrade React to 19, no Turbopack for dev, skip the
React 19 codemods). It bumped `next`/`@next/mdx`/`eslint-config-next` to
15.5.20, `react`/`react-dom` to 19.2.7, `@types/react(-dom)` to 19.x with
matching `overrides`, and ran three jscodeshift transforms — all no-ops for
this codebase (Pages Router, no async request APIs). It also performed an
unrequested `next lint` → ESLint-9-flat-config migration; that part was
**reverted** (flat config deleted, `"lint": "next lint"` restored,
`eslint ^8.57.1` — `next lint` is still supported in Next 15, and the
ESLint 9 migration is deliberately Phase 4c scope). Everything else below
was applied manually.

**Dependencies** (`website/package.json` + lockfile):

- `next`/`@next/mdx`/`eslint-config-next` `^15.5.20`; `react`/`react-dom`
  `^19.2.7`; `@types/react` `19.2.17` and `@types/react-dom` `19.2.3`
  (pinned, mirrored in `overrides` so transitive `@types` stay deduped).
- `@mdx-js/loader`/`@mdx-js/react` `^3.1.1`; `next-mdx-remote` `^5.0.0`
  (v5 = MDX 3 + React 19 support; same entry points and `serialize`
  signature as v4, but compiled MDX now evaluates in **strict mode** — see
  the remarkCustomAttrs fix below).
- remark stack for unified 11: `remark-gfm ^4.0.1`,
  `remark-smartypants ^3.0.2`, `unist-util-visit ^5.1.0`;
  `remark-unwrap-images` **removed**, replaced by `rehype-unwrap-images
  ^1.0.0` (its designated successor; unwrapping now happens at the hast
  stage).
- React-19 peer stragglers, resolved by *upgrading* rather than overriding
  (verified: none of the plan's suspected overrides were needed —
  `@rehooks/online-status` declares no peers and `react-github-btn`'s
  `react >=16.3` already admits 19): `@docsearch/react ^3.9.0` (3.9 widened
  peers to `< 20`; stays on v3 — v4 is Phase 6 scope), `react-inlinesvg
  ^4.5.0`, `react-intersection-observer ^9.16.0`.
- Toolchain: `typescript ^5.9.3`, `@types/node ^22`, `sass ^1.101.0`,
  `eslint ^8.57.1` (config-next 15's `@typescript-eslint` 8 needs
  ≥ 8.57). `html-to-react` resolves to 1.7.0 within its existing `^1.5.0`
  range and works under React 19 (verified at build + runtime on the
  `/models/*` pages) — no bump needed.

**Config / pipeline wiring:**

- `next.config.mjs`: removed `swcMinify` (option removed in Next 15) and
  the inert `experimental.mdxRs` block (it was misplaced inside the MDX
  plugin options and never did anything); the MDX loader now receives
  `rehypePlugins` alongside `remarkPlugins`.
- `plugins/index.mjs`: exports named `remarkPlugins` and `rehypePlugins`
  arrays (`rehypePlugins = [rehype-unwrap-images]`); the default export is
  kept for compatibility. All three MDX pipelines consume both arrays:
  `next.config.mjs` (@next/mdx loader for `.mdx` pages/partials),
  `pages/[...listPathPage].tsx` (server-side next-mdx-remote `serialize`
  for all docs pages), and `src/components/markdownToReact.js`
  (client-side `serialize` for universe/models markdown — the v5 entry
  point `next-mdx-remote/serialize` is unchanged, so no fallback to
  `next-mdx-remote-client` or getStaticProps pre-serialization was needed).
- `tsconfig.json`: `target` `es5` → `ES2017`. Next 15 made no further
  auto-migrations (`moduleResolution: "node"` accepted as-is).
- `pages/[...listPathPage].tsx`: v5 types frontmatter as
  `Record<string, unknown>` (v4 was stringly typed), which added five new
  tsc errors; fixed by passing explicit `serialize<Scope, PageFrontmatter>`
  generics typing the fields the page reads.

**Custom remark plugin audit** (against unified 11 / mdast-util-mdx-jsx v3,
the predicted breakage point):

- `remarkCodeBlocks.mjs`: the fabricated `mdxJsxTextElement` (InlineCode)
  now carries the required `attributes: []` array (v3 expects it; v2
  tolerated its absence).
- `remarkCustomAttrs.mjs`: now also processes headings inside blockquotes.
  This fixes the one real build breakage of the phase:
  `> #### Pipeline Package URLs {id="pipeline-urls"}` in
  `docs/usage/models.mdx` left its `{id="..."}` mdxTextExpression in the
  tree; next-mdx-remote v4 evaluated compiled MDX in sloppy mode, so
  `id = "pipeline-urls"` silently leaked a global and rendered stray
  "pipeline-urls" text (with the in-page `#pipeline-urls` link pointing
  nowhere); v5 evaluates in strict mode, turning it into a hard prerender
  failure (`ReferenceError: id is not defined`). The heading now gets its
  intended `id` + permalink and the anchor works.
- `remarkFindAndReplace.mjs`, `remarkWrapSections.mjs`, `getProps.mjs`: no
  changes needed (mdast text/code/link/heading shapes and the estree
  attribute format are unchanged; remarkWrapSections' legacy MDX-v1
  `'import'`-node handling was already dead code under MDX 2 and stays
  inert — no docs `.mdx` contains real ESM).

**Widget seam** (`src/remark.js`): unchanged and verified working — the
`remarkComponents` map still feeds the `MDXProvider` in `pages/_app.tsx`
(loader pipeline) and the `scope` in `src/templates/index.js`
(next-mdx-remote pipeline). A future Blockly widget registers there
unchanged. No `<BlocklyPipelineBuilder />` embeds exist on this branch yet
(they arrive with the Blockly PR).

### How to verify

```bash
cd website
npm ci
npm run build     # prebuild → next build (15.5.20, exports out/) → next-sitemap
npx tsc --noEmit  # 24 errors, byte-identical list to the Phase 2 baseline (0 new)
```

Verified result (Node v22.22.2): build green — `✓ Generating static pages
(320/320)`, sitemap step runs, `out/` has the same 319 HTML pages as the
Phase 2 baseline (file-list diff clean), `sitemap.xml`/`robots.txt`/kill-
switch `sw.js` present. Spot checks: `/api/doc` renders its 37 tables;
`/usage/training` quickstart-widget markup intact; universe project pages
intact; images are NOT wrapped in `<p>` (rehype-unwrap-images matches the
old remark-unwrap-images behavior — 0 `<p><img` occurrences in docs pages;
universe README pages, which go through the client markdown path, contain
`<p><img` but are unchanged vs Phase 2 — same `<figure>` counts as
Phase 2); 0 leftover `%%…%%` tokens. Plausible: the
script tag is injected at hydration by next-plausible (next/script,
afterInteractive) — it is absent from static HTML in Phase 2 *and* 3
(parity) and was confirmed present in the live DOM (`script[data-domain]`)
on all browser-checked pages.

**Full-corpus normalized HTML diff** (Phase 3 requirement): all 319 pages
were diffed against the Phase 2 build after normalizing hashed asset URLs,
inline script bodies (`__NEXT_DATA__` embeds the compiled MDX, which
changes wholesale with MDX 3 by design), CSS-module class hashes, and
attribute order. Every remaining change falls into one of these classes —
reviewed and accepted, none are regressions:

1. **Next 15 head management**: `data-next-head=""` attributes on
   head tags, `<meta name="next-head-count">` removed, head-element
   reordering (viewport meta and CSS links move; same elements).
2. **React 19 SSR attribute serialization**: casing of a few attributes
   (`noModule`, `readOnly`, `noValidate`, `allowFullScreen` — HTML is
   case-insensitive here) and per-element attribute reordering.
3. **React 19 image preloading**: new `<link rel="preload" as="image">`
   head hints for non-lazy `<img>`s (React Float; performance hint only).
4. **MDX 3 / mdast-util-to-hast 13 GFM tables**: column alignment emitted
   as `style="text-align:…"` instead of the deprecated `align` attribute
   (no site CSS/JS keys off `align`).
5. **remark-smartypants v3**: 6 distinct quote-direction changes — 4 are
   corrections of previously wrong-direction quotes; 2 are new
   wrong-direction cases (`”Compact mode”` where a quote opens a table
   cell, on 2 displacy-related pages, and `Nivre (2005)‘s` where an
   apostrophe directly follows a link, 1 page). Cosmetic typography;
   accepted as upstream behavior rather than editing docs content.
6. **@docsearch/react 3.3 → 3.9**: search button `aria-label` now
   "Search (Command+K)" and `aria-hidden` on its icon.
7. **Intentional fix** (1 page): `/usage/models` — stray "pipeline-urls"
   text removed from the aside heading, which now has
   `id="pipeline-urls"` + permalink (see remarkCustomAttrs above).

DocSearch/Algolia note: heading ids, anchors, and section structure are
unchanged corpus-wide (verified by the same diff — the only id change is
the *added* `#pipeline-urls`), so the crawler selectors keep matching.

**Hydration check** (Chromium via Playwright against `npm run dev`):
loaded `/`, `/usage/spacy-101`, `/usage/training`,
`/universe/project/sense2vec` (client-side serialize path), `/api/doc`.
Pages render fully; Plausible script present in DOM on all five. The dev
console shows hydration mismatches — **all pre-existing**: the identical
checks against a Phase 2 dev server reproduce every one (React 18 wording
"Expected server HTML to contain a matching <button>…" / "Prop className
did not match" vs React 19 wording "Hydration failed…"). Causes are
long-standing SSR/client branches, out of Phase 3 scope: the quickstart
copy-button renders only when `isClient && document.queryCommandSupported`
(`src/components/quickstart.js`), and the dynamically-loaded Prism `Code`
component adds `language-*`/`tabindex` after load. Behavioral nuance:
React 18 patched attribute mismatches to the client value; React 19 keeps
the server value until Prism re-renders — no visible difference. The
"unique key prop" dev warnings (`Code`, `TypeAnnotation`) are likewise
present on Phase 2. No *new* hydration or console errors were introduced.

`tsc --noEmit`: 24 errors, list byte-identical to the Phase 2 worktree
baseline (strict still false; the 5 errors newly introduced by
next-mdx-remote v5's frontmatter typing were fixed, no pre-existing errors
touched).

Build-warning delta vs Phase 2 (nothing actionable): the two pre-existing
"Invalid href" warnings and the large-page-data warnings remain; sass
1.101 now prints `@import`/global-builtin deprecation warnings (Phase 6
lists the `@import` → `@use` rewrite); the sharp recommendation is gone
(Next 15 no longer suggests it for unoptimized exports).

### Fallbacks

None taken. `next-mdx-remote@5.0.0` works as-is in all three pipelines
(the `next-mdx-remote-client` fork and getStaticProps pre-serialization
contingencies were not needed).

### Rollback

`git revert` of this phase's five commits restores Next 14.2.35 /
React 18.2.0 / MDX 2 / next-mdx-remote 4 (lockfile included). Source
changes are small and contained (config, plugin pipeline, two ~1-line
plugin adaptations, one typing block), so the revert is clean. Rendered
output differences across the phase are the seven classified cosmetic
classes above — safe in both directions. Netlify: standard
restore-previous-deploy applies; no service-worker implications (the
Phase 1 kill switch is untouched).

## Phase 4 — Next 16.2.x + bundler strategy + ESLint 9 flat config + tooling

Branch: `migration/phase-4-next16-tooling`

Next 15.5.20 → 16.2.10 with builds pinned to webpack, `next lint` (removed
in 16) replaced by an ESLint 9 flat config, Netlify plugin remnants dropped,
prettier 2 → 3. Rendered output: same 319 HTML pages, file list identical to
the Phase 3 baseline; the full-corpus normalized HTML diff is clean except
one classified, invisible artifact (see below).

Landed versions: `next`/`@next/mdx`/`eslint-config-next` 16.2.10,
`eslint` 9.39.5, `prettier` 3.9.5, `typescript` 5.9.3 (unchanged).

### What changed

**Codemod.** `npx @next/codemod@canary upgrade 16.2.10` ran
non-interactively (version passed explicitly; remaining prompts piped "n").
Its three jscodeshift transforms (app-dir-runtime-config-experimental-edge,
remove-unstable-prefix, remove-experimental-ppr) were all no-ops (71 files
unmodified). Its dependency edits needed correction: it pinned exact
versions (carets restored) and bumped `eslint` to **10.7.0**, which was
reverted — eslint-config-next does not support ESLint 10 yet; this migration
deliberately targets ESLint 9 (the 9 → 10 move stays Phase 6 scope).

**4a/4b — Next 16.2.10 on webpack (bundler decision record).** Next 16
makes Turbopack the default bundler; webpack remains the supported legacy
path behind a CLI flag (`next build --help` lists `--webpack`; there is no
config-file equivalent). The `dev` and `build` scripts now pass
`--webpack`, so `npm run build` / `npm run dev` are webpack, exactly as
before. **This is the locked decision:** the planned Phase 5 PWA
(`@serwist/next`) requires webpack, so webpack-first is not provisional.

- `tsconfig.json`: Next 16 enforces `moduleResolution: "bundler"` and
  `jsx: "react-jsx"` (the build itself rewrites the file otherwise); the
  auto-migration is committed. `npx tsc --noEmit` still reports exactly the
  24 pre-existing errors (list identical to the Phase 3 baseline modulo one
  column number shifted by a reformatted line in `pages/index.tsx`).
- `next.config.mjs`: the `eslint.ignoreDuringBuilds` block was removed —
  Next 16 no longer recognizes the `eslint` key (it warned on every build).

**Upstream regression found and worked around (SWC JSX whitespace).**
Next 16's bundled SWC drops the *leading space* of a JSXText node when the
node (a) spans multiple source lines and (b) contains an HTML entity such
as `&apos;`. Reproduced in isolation against `next/dist/build/swc`
(`" so efficient…"` compiles to `"so efficient…"` when the node contains
`&apos;`; the identical node without the entity keeps the space; Next 15
kept it in both cases). Corpus impact: 5 text nodes, all on the landing
page (`pages/index.tsx`), where the space after an inline `<strong>`
disappeared — visible words ran together ("annotation **tool**so
efficient"). Fix: those five nodes now use literal apostrophes instead of
`&apos;` (rendered output is identical — React re-escapes to `&#x27;` —
and `react/no-unescaped-entities` is off in eslint-config-next, verified
against the old `next lint` too). **Caveat for the TSX-conversion stage:**
avoid HTML entities inside multi-line JSX text until upstream fixes this;
an entity re-introduced into a multi-line text node will silently eat a
word space at its start.

**4b commit B (Turbopack) — attempted, then dropped.** A separate
`build:turbopack` script was implemented and compiled green: string plugin
specifiers gated behind a `TURBOPACK_BUILD=1` env check in
`next.config.mjs` (default webpack build kept the plugin function arrays
untouched), with local plugins as absolute paths — @next/mdx's loader
resolves specifiers against each processed file's directory
(`this.context`), so the plan's relative `'./plugins/…'` form only works
for files at the project root, and `plugins/index.mjs` cannot import
`node:url` itself because the browser bundle also imports it. The output,
however, diverges corpus-wide: Turbopack generates a different CSS-module
class-name scheme (`navigation_root__NM8yI` →
`navigation-module-sass-module__JHkvfa__root`), changing every `class`
attribute on every page (~291k normalized diff lines), plus different
static-asset name hashing. That is a non-trivial rendered-output
divergence (and a DocSearch-crawler / cache risk), so per plan the commit
was dropped and the branch stays webpack-only. HTML page lists were
identical, so Turbopack remains *viable* if ever needed — but not
output-compatible.

**4c — ESLint 9 flat config.** `eslint ^9.39.5` +
`eslint-config-next ^16.2.10`. New `website/eslint.config.mjs` spreads the
`eslint-config-next/core-web-vitals` flat export (the same base the old
`.eslintrc.json` extended); `.eslintrc.json` and `.eslintrc` deleted (the
latter was dead config — ESLint resolved `.eslintrc.json` first). Lint
script: `next lint` → `eslint pages src meta plugins`. Parity with the old
baseline is exact: the same 3 findings (2 × `react/no-direct-mutation-state`
errors in `src/components/juniper.js` 138/146, 1 × `@next/next/no-img-element`
warning in `src/components/embed.js` 113) and the same exit code 1 — the
juniper errors are pre-existing and juniper is Phase 6 replacement scope.
To get there, rules newly enforced by eslint-config-next 16 /
eslint-plugin-react-hooks 7 were tuned off instead of mass-fixing
long-standing code (`react/no-unescaped-entities`,
`react-hooks/set-state-in-effect`, `react-hooks/immutability`,
`react-hooks/refs`, `import/no-anonymous-default-export` — 19 findings:
11 in long-standing code untouched by this branch, and 8
`react/no-unescaped-entities` flags on the literal apostrophes that the
4a SWC workaround itself introduced in `pages/index.tsx` — that rule must
stay off until the upstream SWC JSXText-entity bug is fixed, or "fixing"
its flags by restoring `&apos;` re-triggers the word-gluing bug on the
landing page), and the generated
`meta/site.generated.mjs` is ignored (it was never linted before —
`next lint` did not cover `meta/`).

**4d — Netlify cleanup.** `website/netlify.toml`: dropped the
`@netlify/plugin-nextjs` plugins block and the `NETLIFY_NEXT_PLUGIN_SKIP`
env — publishing the static `out/` needs neither. No other references
exist in the repo; the root `netlify.toml` redirects are untouched.

**4e — Tooling.** `prettier ^3.9.5`. The repo's `.prettierrc` already
pins every option whose default changed in prettier 3 (notably
`trailingComma: "es5"`), so no tree-wide reformat: the only source delta
was trailing commas in `next.config.mjs`. `prettier --check` passes on all
files this branch touches. `.prettierignore` gains `out/` and
`MIGRATION_LOG.md` (historical entries predate prettier 3's markdown
emphasis normalization). TypeScript stays 5.9.3 — the latest 5.x and the
plan's consolidated target (`^5.9`); npm's `latest` now points at the 7.x
native-compiler major, out of scope here and incompatible with the
24-error baseline requirement.

### Verification

1. `npm ci && npm run build` green from a clean install (webpack path,
   sitemap generated). `out/` HTML file list: 319 pages, byte-identical to
   the Phase 3 baseline list.
2. Full-corpus normalized HTML diff vs the verified Phase 3 build tree
   (buildId/chunk/CSS asset refs normalized): **2 diff lines on 1 page** —
   on `/`, `ready to <code>` became `ready to<!-- --> <code>`; an
   invisible React text-separator comment introduced because prettier's
   rewrap of `pages/index.tsx` moved a line break before `<InlineCode>`
   (explicit `{' '}`). Rendered DOM and text are identical; the same
   comment pattern already exists elsewhere on the page. Everything else,
   including all MDX pages, `/usage/spacy-101`, `/api/doc`, and
   `/universe/project/*`, is byte-identical after normalization
   (`__NEXT_DATA__` payloads compared separately: only webpack
   `dynamicIds` module-id churn).
3. `npm run lint`: exact pre-upgrade parity (3 findings, exit 1; see 4c).
4. `npx tsc --noEmit`: 24 errors, none new (see 4a/4b).
5. `npm run dev` (webpack): ready in <1 s, `/` responds 200 with expected
   landing content; the SWC whitespace fix holds in dev output too.
6. Kill-switch `out/sw.js`, `out/sitemap.xml`, `out/robots.txt` present.
7. Build-warning delta vs Phase 3: none meaningful — the same sass
   deprecation and large-page-data warnings; the `eslint`-key config
   warning was eliminated (4a).

### Rollback

`git revert` of this phase's five commits restores Next 15.5.20 /
ESLint 8 + `next lint` / prettier 2 (lockfile included). Source changes
are small and contained (scripts, one config key, flat-config file,
netlify.toml, five text nodes in `pages/index.tsx`); the revert is clean.
Rendered output differs across the phase only by the one invisible comment
node above — safe in both directions. Netlify: standard
restore-previous-deploy; no service-worker implications (the Phase 1 kill
switch is untouched).

---

## Phase 5 — PWA via @serwist/next (replaces the Phase 1 kill switch)

Branch: `migration/phase-5-pwa-serwist`

The site is a PWA again: `@serwist/next` 9.5.11 (+ `serwist` 9.5.11, dev)
compiles `src/sw.ts` into `public/sw.js` at build time, precaching all
`_next/static` assets and `public/` files and runtime-caching pages for
offline use. The generated worker ships at the **same URL** (`/sw.js`) as
the Phase 1 kill switch, which is deleted in the same commit — returning
visitors' browsers re-fetch `/sw.js` on navigation, so the kill-switch
worker (or the old next-pwa worker, for visitors who never returned since
Phase 1) is superseded by the Serwist worker in one deploy. Scope is
offline/runtime caching + installability only; **no web push/VAPID** — a
static export has no server to hold subscriptions.

Landed versions: `@serwist/next` ^9 (9.5.11), `serwist` ^9 (9.5.11, dev
dependency). Requires webpack builds — satisfied by Phase 4's `--webpack`
scripts; this dependency is why webpack-first was locked there.

### What changed

**The swap seam (for replacing this PWA implementation later):** the
entire integration is (1) the `withSerwist()` wrapper in
`next.config.mjs` and (2) the worker source `src/sw.ts`. Nothing else in
the site imports Serwist; registration is injected into the client bundle
by the wrapper. To swap in a different PWA implementation, replace those
two files and keep serving *some* worker at `/sw.js`.

- `src/sw.ts` — worker source: `new Serwist({ precacheEntries:
  self.__SW_MANIFEST, skipWaiting: true, clientsClaim: true,
  runtimeCaching: defaultCache }).addEventListeners()`. `defaultCache`
  (from `@serwist/next/worker`) gives NetworkFirst pages / cache-first
  hashed assets.
- `next.config.mjs` — config composed as `withSerwist(withMDX({...}))`
  with `swSrc: 'src/sw.ts'`, `swDest: 'public/sw.js'`, `disable` in
  development (dev emits and registers nothing; `/sw.js` 404s).
- `tsconfig.json` — `webworker` lib, explicit `types` array (`node`,
  `react`, `react-dom`, `mdx` — the ambient types the codebase already
  relied on via auto-inclusion — plus `@serwist/next/typings`), exclude
  the generated `public/sw.js`.
- `public/sw.js` (kill switch) **deleted**; `public/sw.js`,
  `public/sw.js.map`, `public/swe-worker*` gitignored (build artifacts).
- `netlify.toml` — `/sw.js` served with `Cache-Control: no-cache,
  no-store, must-revalidate` (+ explicit Content-Type). With
  `output: 'export'`, `headers()` in next.config does not apply, so this
  must live at the hosting layer. Any future host must replicate it, or
  SW updates (including any future kill switch) stall behind HTTP caches.
- PWA metadata: unchanged — `public/manifest.webmanifest` (name, colors,
  `display: minimal-ui`, 192/256/384/512 icons, all present in
  `public/icons/`) was already linked from `pages/_app.tsx`.

### How to verify

1. `npm ci && npm run build` green; `out/sw.js` is the Serwist worker
   (contains `precacheEntries:[{'revision':...` — 141 entries: 93
   `_next/static` + icons/images/manifest), not the kill switch.
2. `find out -name '*.html' | sort`: 319 pages, identical to the Phase 4
   baseline list. Normalized spot-diff (`/`, `/usage/spacy-101`) vs the
   Phase 4 build tree: byte-identical after buildId/chunk-hash
   normalization — registration lives inside the existing `main-*.js`
   chunk (`window.serwist` + `register('/sw.js', { scope: '/' })`), no
   new script tags.
3. Headless-Chromium runtime check against `out/` over localhost HTTP:
   `navigator.serviceWorker.ready` resolves (scriptURL `/sw.js`, scope
   `/`); `caches` contains `serwist-precache-v2-...` with 141 entries;
   with the static server **stopped** and the browser context offline,
   reloading `/usage/spacy-101` and navigating back to `/` (both visited
   while controlled) render fully from SW caches with correct titles.
4. `npx tsc --noEmit`: 24 errors, list identical to the Phase 4 baseline
   (`src/sw.ts` typechecks clean). `npm run lint`: exact parity (same 3
   pre-existing findings; `src/sw.ts` clean).
5. Dev check: `npm run dev` → `GET /sw.js` 404, no `serwist` string in
   the served HTML, `public/sw.js` not (re)generated.

### Rollback

If the PWA misbehaves in production, do **not** simply revert to a
missing `/sw.js` — visitors who received the Serwist worker would keep
serving stale caches. Rollback = restore the Phase 1 kill-switch worker
at `public/sw.js` (from git history: `git show
3ecc7b0:website/public/sw.js`), remove the `withSerwist()` wrapper in
`next.config.mjs` (or set `disable: true`), and redeploy: returning
browsers re-fetch `/sw.js` (the netlify.toml no-cache header exists
precisely to keep this path fast) and the kill switch unregisters and
clears all caches, exactly as designed in Phase 1. The `git revert` of
this phase's commits does all of that except *restoring* the kill switch
— that file must come back in the same deploy.
