# spaCy Website Migration: Next.js 13.0.2 → 16.2.x (latest)

## Context

The spaCy docs site (`website/`, deployed to Netlify as static HTML from `website/out`) runs Next.js 13.0.2 with the Pages Router and the `next export` command, which was **removed in Next 14**. Several of its dependencies are unmaintained (`next-pwa` v5, `browser-monads`) or dead weight (`remark-react`, `node-fetch`, `remark` — zero imports). The goal is to bring the site to the current Next.js 16.2.x LTS with React 19, Node 22, and MDX v3, while keeping the site fully static.

**Decisions made with the user:**
- **Stay on the Pages Router** (fully supported in 16.2; no App Router migration).
- **Remove `next-pwa`**; the user will bring their own PWA format during migration, so the Serwist replacement is planned as a clearly separable, optional phase they can swap out.

**Key facts from exploration (verified in code):**
- All pages are pure SSG (`getStaticProps`/`getStaticPaths`, `fallback: false`); no server features. `next/link` already uses non-legacy behavior; `next/image` usage is modern.
- Dual MDX stack: `@next/mdx` (bundler loader) for ~20 imported partials (`pages/index.tsx`, `src/remark.js`), and `next-mdx-remote` v4 `serialize()` for the docs catch-all `pages/[...listPathPage].tsx` and client-side in `src/components/markdownToReact.js`. Only the loader path is bundler(Turbopack)-sensitive.
- `experimental: { mdxRs: true }` in `next.config.mjs` is misplaced inside the `MDX({...})` options and has always been inert — do not carry it forward.
- `next-pwa`'s generated `sw.js` isn't committed, but production visitors have a registered service worker → removal needs a **kill-switch SW** or stale caches serve the old site forever.
- Juniper interactive code runner (`src/components/juniper.js`, `@jupyterlab/services` v3 + `ws`) is client-only via `next/dynamic ssr:false` → pin, don't rewrite (follow-up).
- The Python prebuild (`setup/setup.sh` → `jinja_to_js.py` generating `src/widgets/quickstart-training-generator.js`) is orthogonal to Next; keep working.

## Phases (each independently buildable/deployable)

### Phase 0 — Toolchain baseline (no Next changes)
Node 22 LTS (Node 20 is EOL as of Apr 2026; Next 16 needs ≥ 20.9), Python 3.12.
- `website/.nvmrc`: `18` → `22`; `website/Dockerfile`: `FROM node:18` → `node:22`
- `website/package.json`: replace nonstandard `"engine": 18` with `"engines": { "node": ">=20.9" }`
- `website/runtime.txt`: `3.8` → `3.12`

Verify: `node -v`; `pip install -r setup/requirements.txt && sh setup/setup.sh` regenerates the quickstart generator; `npm ci && npm run build` still green on Node 22.

### Phase 1 — Build-pipeline modernization on Next 13.5.x
Eliminate `next export` and next-pwa **before** any major bump. Bump `next`/`@next/mdx`/`eslint-config-next` to `13.5.11` (`output: 'export'` needs ≥ 13.3).

1a. **`output: 'export'`**: add to `website/next.config.mjs`; build script becomes `next build && npm run sitemap` (export now happens inside `next build`). Bump `next-sitemap` → `^4.2.3` and add `outDir: 'out'` in `website/next-sitemap.config.mjs` so `sitemap.xml`/`robots.txt` land in the published dir.

1b. **Remove next-pwa + SW kill switch**: delete `withPWA` wrapper and dep; add `website/public/sw.js` kill switch (skipWaiting → delete all caches → unregister → reload clients). Keep `manifest.webmanifest` + `<link rel="manifest">` in `_app.tsx`. Kill switch must ship in the **same deploy** as the removal.

1c. **Dead-weight removal**: drop `remark`, `remark-react`, `node-fetch` (zero imports). Replace `browser-monads` with `typeof window !== 'undefined'` guards / `useEffect` in its 8 files: `pages/404.js`, `src/widgets/changelog.js`, `src/components/{quickstart,progress,section,sidebar,juniper}.js`, `src/templates/models.js`. Keep `ws` (transitive for jupyterlab).

Verify: `npm run build`; diff `find out -name '*.html' | sort` against a pre-change baseline (catch `/usage.html` vs `/usage/index.html` shape changes); confirm `out/sitemap.xml` + `out/robots.txt`; spot-check `/`, `/usage`, `/usage/spacy-101`, `/models/en`, `/universe`, `/api/doc`.

### Phase 2 — Next 14.2.x (cheap checkpoint)
`next`/`@next/mdx`/`eslint-config-next` → `^14.2.x`. No code changes expected (the only relevant 14 breakage, `next export`, was pre-solved). Verify with build + `out/` diff + MDX partial spot-checks (`/` benchmarks table, `/usage/spacy-101` 101-partials).

### Phase 3 — React 19 + MDX v3 + next-mdx-remote v5 + Next 15.5.x (the big one)
These four are interlocked and move together. Next 15 still defaults to webpack, deferring Turbopack to Phase 4. Run `npx @next/codemod@latest upgrade 15` first (expect near-noop).

Dependency targets: `next ^15.5`, `react`/`react-dom ^19.2`, `@types/react(-dom) ^19`, `@types/node ^22`, `typescript ^5.9`, `@next/mdx ^15.5`, `@mdx-js/loader`/`@mdx-js/react ^3.1`, `next-mdx-remote ^5`, `remark-gfm ^4`, `remark-smartypants ^3`, `unist-util-visit ^5`, `sass ^1.89`, `next-plausible ^3.12`, `react-inlinesvg ^4`, `react-intersection-observer ^9.16`. Replace `remark-unwrap-images` with `rehype-unwrap-images ^1`. Add npm `overrides` (or a local hook) for React-18-peer stragglers: `@rehooks/online-status`, `react-github-btn`, `@docsearch/react@3`.

Code changes:
- `website/next.config.mjs`: remove `swcMinify` (removed in 15) and the inert `mdxRs` block; pass `rehypePlugins` to MDX options.
- `website/plugins/index.mjs`: drop `remark-unwrap-images`; export a `rehypePlugins` array (`rehype-unwrap-images`). Update the three consumers: `next.config.mjs`, `pages/[...listPathPage].tsx` (`mdxOptions: { remarkPlugins, rehypePlugins }`), `src/components/markdownToReact.js`.
- Audit the four custom plugins (`plugins/remarkCodeBlocks.mjs` etc.) against unified 11 / `mdast-util-mdx-jsx` v3 node shapes — most likely breakage point; they're small (~100 lines), adapt in place.
- `website/tsconfig.json`: `target` `es5` → `ES2017` (MDX v3 requirement); accept Next's auto-migration (`moduleResolution: "bundler"`).

Fallbacks: if `next-mdx-remote@5` misbehaves, the maintained `next-mdx-remote-client` fork supports MDX 3 + Pages Router; if client-side `serialize()` in `markdownToReact.js` breaks, pre-serialize universe markdown in `getStaticProps` (better anyway).

Verify: dev-server hydration console clean on `/` and `/usage/spacy-101`; full build + `out/` diff; MDX-heavy spot-checks (`/api/doc` tables, `/usage/training` quickstart widget, `/universe/project/*` for client-side serialize); images unwrapped from `<p>` in HTML; Plausible script emitted.

### Phase 4 — Next 16.2.x + bundler strategy + ESLint 9 flat config
- 4a: `next`/`@next/mdx`/`eslint-config-next` → `^16.2.x`, `eslint` → `^9.39`; run `npx @next/codemod@canary upgrade latest`.
- 4b: **Webpack-first, two commits.** Commit 1: add `--webpack` to `dev`/`build` scripts (supported legacy path in 16; guaranteed green — this alone completes the upgrade). Commit 2 (optional): drop `--webpack` for Turbopack (default in 16) by converting `@next/mdx` plugin options to serializable string specifiers (`'remark-gfm'`, `'./plugins/remarkCodeBlocks.mjs'`, …). Only the ~20 imported partials go through the bundler loader, so Turbopack risk is confined to `/` and 101-partial pages. If local-path strings don't resolve, wrap plugins in a tiny named local package — or **stay on `--webpack` permanently** (explicitly acceptable).
- 4c: `next lint` is removed in 16 → create `website/eslint.config.mjs` from `eslint-config-next@16`'s flat export; delete `.eslintrc`/`.eslintrc.json`; `"lint": "eslint pages src meta plugins"`.
- 4d: cleanup — `website/netlify.toml`: drop the `@netlify/plugin-nextjs` block and `NETLIFY_NEXT_PLUGIN_SKIP` (publishing static `out/` needs neither).

Verify: webpack build → `out/` diff; Turbopack build → diff `out/` against webpack `out/` (file list + HTML spot-diff); dev hot-reload on an MDX partial edit; lint runs; Netlify deploy preview.

### Phase 5 — PWA via @serwist/next (OPTIONAL / SWAPPABLE)
Isolated to one config wrapper + one source file so the user's own PWA format can slot into the same seam. If skipped, only do the last bullet.
- Add `@serwist/next ^9` + `serwist ^9` (or `@serwist/turbopack ^10` if Phase 4 landed on Turbopack builds — `@serwist/next` needs webpack).
- New `website/src/sw.ts`: `new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting: true, clientsClaim: true, runtimeCaching: defaultCache }).addEventListeners()`.
- `next.config.mjs`: `withSerwist(withMDX({...}))` with `{ swSrc: 'src/sw.ts', swDest: 'public/sw.js', disable: dev }`.
- Delete the Phase 1 kill-switch `public/sw.js`; gitignore the generated `sw.js`/maps.

Verify: `out/sw.js` exists after build; `npx serve out` → DevTools Application → SW registered, precache populated, offline reload of a cached page works.

### Phase 6 — Follow-ups (out of scope for this migration)
Juniper/`@jupyterlab/services` v3 replacement (thebe/jupyterlite), `html-to-react` React-19 audit, prettier 2→3, `@docsearch/react` 3→4, ESLint 9→10 (ESLint 9 EOLs 2026-08-06) once config-next allows, sass `@import`→`@use` rewrites, tsconfig `strict: true`.

## Consolidated final dependency targets

```
next ^16.2.x            react ^19.2             react-dom ^19.2
@next/mdx ^16.2.x       @mdx-js/loader ^3.1     @mdx-js/react ^3.1
next-mdx-remote ^5      remark-gfm ^4           remark-smartypants ^3
rehype-unwrap-images ^1 unist-util-visit ^5     next-sitemap ^4.2.3
next-plausible ^3.12    sass ^1.89              typescript ^5.9
@types/react(-dom) ^19  @types/node ^22         eslint ^9.39 + eslint-config-next ^16.2
react-inlinesvg ^4      react-intersection-observer ^9.16
(optional) @serwist/next ^9 or @serwist/turbopack ^10, serwist ^9
REMOVED: next-pwa, remark, remark-react, remark-unwrap-images, node-fetch, browser-monads
PINNED/UNCHANGED: @jupyterlab/services ^3, ws, acorn, md-attr-parser, prismjs,
@mapbox/rehype-prism, jinja-to-js, codemirror stack, @docsearch/react ^3 (override),
react-github-btn (override), classnames, prop-types, parse-numeric-range
```

## Critical files

- `website/next.config.mjs` — every phase (output export, PWA unhook/rehook, MDX options, swcMinify, Turbopack strings)
- `website/package.json` — scripts, versions, engines, overrides
- `website/plugins/index.mjs` (+ the four custom `remark*.mjs` plugins) — plugin arrays feeding all three MDX pipelines
- `website/pages/[...listPathPage].tsx` — next-mdx-remote v5 serialize path for all docs pages
- `website/src/components/markdownToReact.js` — client-side serialize, highest-risk v5 consumer
- `website/next-sitemap.config.mjs`, `website/netlify.toml`, `website/.nvmrc`, `website/Dockerfile`, `website/runtime.txt`

## End-to-end verification (per phase and final)

1. `cd website && npm ci && npm run build` — build green, `out/` populated with `sitemap.xml`, `robots.txt`.
2. Diff `find out -name '*.html' | sort` against the previous phase's baseline — no URL-shape regressions.
3. `npm run dev`, spot-check with a browser (Playwright/Chromium available): `/`, `/usage`, `/usage/spacy-101`, `/usage/training` (quickstart widget), `/models/en`, `/universe` + one `/universe/project/*`, `/api/doc`, and the 404 page. Console free of hydration errors.
4. Netlify deploy preview per phase; verify redirects from root `netlify.toml` still apply.
5. Git: develop on `claude/nextjs-migration-plan-ym9zl3`, one commit (or a few) per phase, push with `git push -u origin claude/nextjs-migration-plan-ym9zl3`.
