# DEV_DEMO_PROMPT — build the spacy.fugl.dev demo-deploy scaffolding

This file is a **ready-to-use prompt** for an agent (or a human following it as
a checklist) working in a separate environment — the machine that hosts
`~/code/personal/fugl.dev/` — to build the demo-deploy scaffolding for the
spaCy docs site. It exists because the repo's own automation must not deploy
anything and the scaffolding directory lives outside the repo.

Companion doc: [`website/DEMO_DEPLOY.md`](website/DEMO_DEPLOY.md) describes the
same deploy shape from the repo's side. It was written before the Next.js
migration landed; **where the two disagree, this file wins** (the stale parts
of that doc are called out below).

---

## Prompt

You are working on the machine that hosts `~/code/personal/fugl.dev/`. Build
the demo-deploy scaffolding for the spaCy docs site in a **new directory**
`~/code/personal/fugl.dev/spacy/`. That directory is NOT a git repository — it
is a plain directory, matching the conventions of its sibling wrangler-project
directories (`code/`, `russ/`, `join/`, `git/`, …). Do not initialize git in
it.

### Source repository state (facts to rely on)

The source repo is the spaCy fork (`mmusa-russ-fugal/spaCy`), default branch
`master`. As of this prompt:

- `website/` is a **Next.js 16.2.x (Pages Router)** static-export site:
  `output: 'export'` in `website/next.config.mjs`, builds with webpack
  (`next build --webpack` via the `build` script). `cd website && npm ci &&
  npm run build` produces the fully static site in `website/out` (319 HTML
  pages plus assets), including `out/sw.js`. Node 22 LTS required
  (`website/.nvmrc`), plus Python 3 for the prebuild step (it runs
  `setup/setup.sh` to regenerate a widget module — `pip install -r
  setup/requirements.txt` first on a fresh machine).
- The site ships a **Serwist PWA service worker** at `/sw.js`. With static
  export, HTTP headers cannot come from Next itself — the hosting layer MUST
  serve `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate`.
  (For the Netlify production site this lives in `website/netlify.toml`; for
  this Cloudflare demo it comes from a `_headers` file, below.)
- `pipeline-composer/` (repo root) is a standalone Vite/React/TS Blockly app
  with an **optional** stdlib-only Python run-server at
  `pipeline-composer/server/run_server.py` (its tests live in
  `pipeline-composer/server/`; the shared runner is
  `pipeline-composer/runner/spacy_runner.py`). The docs site does not depend
  on it.
- Stale claims in `website/DEMO_DEPLOY.md` to ignore: it says the site is Next
  13.0.2 using the standalone `next export` CLI step, and that
  `pipeline-composer` is unmerged. All superseded — the migration (phases 0–5)
  and the composer are on `master`.

### What to create in `~/code/personal/fugl.dev/spacy/`

1. **`wrangler.jsonc`** — Cloudflare Workers Static Assets, no Worker script
   (`main` intentionally absent), matching the sibling projects' shape:

   ```jsonc
   {
     "$schema": "node_modules/wrangler/config-schema.json",
     "name": "spacy-fugl-dev",
     "compatibility_date": "<today's date>",
     // Fully static docs site: serve the exported directory, no Worker script.
     "assets": {
       "directory": "./out"
     },
     "routes": [{ "pattern": "spacy.fugl.dev", "custom_domain": true }]
   }
   ```

   Check a sibling project (e.g. `../code/`) for the wrangler version pattern
   in use (devDependency + `node_modules/wrangler/config-schema.json` schema
   path vs. a globally installed wrangler) and match it.

2. **`out/`** — the built static export. Populate it by building the source
   repo (`cd <spaCy-checkout>/website && npm ci && npm run build`) and copying
   `website/out/` here in full (including `sw.js`, `sitemap*.xml`,
   `robots.txt`, `_next/`, `manifest.webmanifest`).

3. **`out/_headers`** — Cloudflare's static `_headers` file (Workers Static
   Assets honors `_headers` inside the assets directory). Required content:

   ```
   /sw.js
     Cache-Control: no-cache, no-store, must-revalidate
   ```

   Rationale: browsers re-fetch the service worker on navigation; if `/sw.js`
   were cached by the CDN/browser, PWA updates (and any future kill-switch
   worker) could not propagate. Add further headers only if the sibling
   projects set a precedent worth mirroring.

   Note: since `_headers` sits inside `out/`, a fresh copy of the build output
   will wipe it — script the copy step to re-create `_headers` after each
   sync (see README step below).

4. **`Dockerfile`** — builds the optional run-server image. Build context is
   the source repo (the file needs `pipeline-composer/server/run_server.py`
   and `pipeline-composer/runner/spacy_runner.py`). Keep it minimal: a
   `python:3.12-slim` (or similar) base, `pip install spacy` plus at least one
   small pipeline package (e.g. `en_core_web_sm`) so demos can actually run,
   copy the server + runner files, non-root user, `CMD` running
   `run_server.py`. Check the server's source for its port and bind address
   and expose accordingly (it is a localhost dev tool with origin/Host
   allowlists — read `run_server.py` before wiring, and pass through any
   allowlist configuration it supports rather than weakening it).

5. **`docker-compose.yml`** — one opt-in service wrapping that image
   (`build.context` pointing at the spaCy checkout, port mapping to
   localhost). No profiles/dependencies that would start it implicitly;
   document that it is demo-only.

6. **`README.md`** — short, factual: what this directory is, the manual deploy
   steps (below), the `_headers` re-creation caveat, and an explicit "nothing
   here auto-deploys" note.

   Manual steps it must list:

   ```bash
   # 1. Build the static site (in the spaCy checkout)
   cd <spaCy-checkout>/website && npm ci && npm run build

   # 2. Sync the export into the deploy dir and restore _headers
   rsync -a --delete <spaCy-checkout>/website/out/ ~/code/personal/fugl.dev/spacy/out/
   printf '/sw.js\n  Cache-Control: no-cache, no-store, must-revalidate\n' \
     > ~/code/personal/fugl.dev/spacy/out/_headers

   # 3. Local preview (serves, does NOT publish)
   cd ~/code/personal/fugl.dev/spacy && wrangler dev

   # 4. Deploy — HUMAN-RUN ONLY, when explicitly chosen
   wrangler deploy   # publishes to spacy.fugl.dev

   # Optional: live pipeline execution for demos
   docker compose build   # verify it builds
   docker compose up      # opt-in, demo sessions only
   ```

### Verification (do these; do NOT publish)

- `wrangler dev` serves the site locally: `/` renders, `/usage/spacy-101`
  renders, and `curl -I <local>/sw.js` shows the no-cache `Cache-Control`
  header from `_headers`.
- `docker compose build` completes. Do not `docker compose up` in an
  unattended run unless you also verify and then stop it; never expose it
  beyond localhost.
- `wrangler deploy` is NOT run. Nothing is published. The directory is left
  ready for a human to deploy.

### Hard constraints

- No deployment, no DNS changes, no Cloudflare API mutations — scaffolding and
  local verification only.
- Do not weaken the run-server's security posture (CORS/Host/model
  allowlists).
- Do not turn the deploy directory into a git repo, and do not commit any of
  it back into the spaCy fork.
