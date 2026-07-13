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
later Python-based tooling. The build output (`website/out/`) is byte-for-byte
equivalent to before — the source fix only changes *how* `meta/site.json` is
loaded, not its values.

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

### Rollback

Revert this phase's commits on `migration/phase-0-toolchain`, or drop the branch
entirely. The change is fully contained in the pin files (`.nvmrc`,
`package.json`, `runtime.txt`, `Dockerfile`) and the JSON-interop fix
(`meta/dynamicMeta.mjs`, `setup/generateSiteModule.mjs`, `setup/setup.sh`,
`.gitignore`) — no lockfile edits and no committed generated artifacts
(`meta/site.generated.mjs` is gitignored). `git revert <commit>` cleanly restores
Node 18 / Python 3.8 and the original `assert`-based JSON import. Note: reverting
the interop fix without also reverting the Node pin re-breaks the build on Node 22.
