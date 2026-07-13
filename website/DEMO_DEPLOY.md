# Demo deployment

This document describes how a **demo** deployment of the spaCy docs site is set
up. It is intentionally kept in the repo's git history so the deploy shape is
recoverable, even though the actual deploy working directory lives **outside**
this repo.

> **This document does not deploy anything.** No production (or demo) deploy is
> performed by this repo's automation. The scaffolding described here only
> *prepares* for a deploy that a human runs manually, later, from the external
> directory. Read it as "here is how the demo is wired up", not "run this to
> ship".

## Where the deploy lives

The demo is deployed from a plain directory outside this repo:

```
~/code/personal/fugl.dev/spacy/
```

That directory is **not** a git checkout of spaCy. It is a sibling of the other
personal-site wrangler projects under `~/code/personal/fugl.dev/`
(`code/`, `russ/`, `join/`, `git/`, …), and it follows the same conventions as
those projects. A separate orchestration step builds that directory; this repo
only carries the documentation that describes its intended shape.

## Deploy target

- **Platform:** Cloudflare Workers, via `wrangler`.
- **What is served:** the fully static Next.js export in `website/out` — the
  build output produced when the site uses `output: 'export'` (Next.js). This
  repo is mid-migration from Gatsby to Next.js, so `website/out` exists once the
  Next.js migration phases land (see `website/NEXTJS_MIGRATION_PLAN.md` if
  present); it is not necessarily present in every checkout today.
- **No server-side logic.** The docs site is 100% static HTML/CSS/JS. There is
  no Worker script, no runtime code, no bindings. It is pure static-asset
  hosting behind a custom domain.

### `wrangler.jsonc`

The deploy directory carries a `wrangler.jsonc` that matches the pattern of the
sibling personal-site projects (`$schema`, `name`, `compatibility_date`, a
`custom_domain` route). Because the docs site is fully static, it uses Workers
Static Assets (an `assets` directory) and defines **no** `main` entry — there is
no Worker to run.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "spacy-fugl-dev",
  "compatibility_date": "2026-05-07",
  // Fully static docs site: serve the exported directory, no Worker script.
  "assets": {
    "directory": "./out"
  },
  "routes": [
    { "pattern": "spacy.fugl.dev", "custom_domain": true }
  ]
}
```

The `./out` referenced here is the built static export copied/placed into the
deploy directory (the same content this repo produces at `website/out`). The
`spacy.fugl.dev` custom domain mirrors how the sibling projects bind
`code.fugl.dev`, `git.fugl.dev`, `join.fugl.dev`, etc.

## Optional companion: `pipeline-composer` run-server

The static docs site needs **no** server. Separately, `pipeline-composer` (the
interactive pipeline-builder widget) ships an **optional** local Python
run-server that can execute pipelines live during a demo. This is strictly
opt-in — the docs site deploys and works without it.

For demos that want live execution, the run-server is packaged with Docker so it
can be started as a companion service alongside the static site:

- A `Dockerfile` that builds the Python run-server image.
- A `docker-compose.yml` that runs it as a single opt-in service (e.g. exposing
  the run-server on a local port the demo front-end can call).

Bring it up only when live pipeline execution is wanted:

```bash
docker compose up   # optional — live pipeline execution for demos only
```

Nothing about the static docs deploy depends on this service being running.

## Manual deploy steps

These steps are run **by a human**, from the external deploy directory. They are
listed here for reference; running them is not part of this repo's automation.

1. **Build the static site** (in this repo):

   ```bash
   cd website/
   npm run build      # produces website/out (Next.js static export)
   ```

2. **Place the build** into the deploy directory's `out/` (the orchestration
   step that populates `~/code/personal/fugl.dev/spacy/` handles this).

3. **Verify locally** — `wrangler dev` serves the assets locally and does
   **not** publish anything:

   ```bash
   cd ~/code/personal/fugl.dev/spacy/
   wrangler dev       # local preview only; nothing is published
   ```

4. **Deploy** — the actual publish, run manually by a human when they choose to:

   ```bash
   cd ~/code/personal/fugl.dev/spacy/
   wrangler deploy    # manual, human-initiated; publishes to spacy.fugl.dev
   ```

## Summary

- The demo deploy directory lives outside this repo at
  `~/code/personal/fugl.dev/spacy/`.
- It hosts the static `website/out` export on Cloudflare Workers at
  `spacy.fugl.dev`, with no server-side logic.
- `pipeline-composer`'s Dockerized Python run-server is an **optional** companion
  for live demos only.
- **No deployment happens as part of this repo.** This doc and any scaffolding
  only prepare for a manual `wrangler deploy` that a human runs later.
