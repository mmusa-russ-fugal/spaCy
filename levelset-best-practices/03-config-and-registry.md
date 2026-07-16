# 03 — Config & registry: declarative runs, versioned names, reproducible artifacts

How spaCy makes an entire pipeline reconstructable from one declarative file, keeps
old configs working as code evolves, and lets third parties plug in by name. Primary
sources: `spacy/util.py:181-301`, `spacy/default_config.cfg`, `spacy/schemas.py`,
`spacy/language.py` (`from_config` / `config` / `to_disk`).

## 1. One declarative config describes the whole run

`spacy/default_config.cfg` covers everything — language/tokenizer, every component
with its full parameters, data sources, training schedule, initialization. Code
implements *capabilities*; the config selects and parameterizes them. Two mechanisms
keep it composable:

- **Registry references**: an `@registry-name = "registered.function.v1"` key whose
  sibling keys become that function's arguments —

  ```ini
  [training.optimizer]
  @optimizers = "Adam.v1"
  learn_rate = 0.001

  [components.tagger.model.tok2vec]
  @architectures = "spacy.HashEmbedCNN.v2"
  ```

  Resolution is **bottom-up** (`registry.resolve`): leaves are constructed first and
  injected into their parents — dependency injection driven entirely by data.

- **Interpolation and dot-path references**: `${paths.train}` centralizes
  environment-specific values; `train_corpus = "corpora.train"` references a shared
  object by path instead of inlining it. The same config runs anywhere by overriding
  one `[paths]` section.

### The round trip is lossless — in both directions

`Language.from_config` builds a live pipeline from config; the `Language.config`
property (`language.py:280-312`) regenerates the *complete* config from the live
object. Object ⇄ file, no information lost. This is the property that makes "save a
model, load it elsewhere, get identical behavior" trivially true.

### Fill-config: persist expanded defaults with the artifact

Before running, `registry.fill` (`language.py:1826`) writes **every default of every
referenced function into the config**, validating types along the way. The saved
`config.cfg` next to trained weights is therefore fully self-describing: when the
library's defaults change in a later release, old models still load with the
defaults they were trained under. **Reproducibility comes from persisting the
expanded config with the artifact, not from re-deriving defaults at load time.**

## 2. Registries: string names as the plugin boundary

`class registry(thinc.registry)` (`util.py:181-208`) declares one catalogue per
function type — `architectures`, `factories`, `tokenizers`, `scorers`, `readers`,
`loggers`, `batchers`, `misc`, … Each is created with `entry_points=True`, so any
pip-installed package declaring the matching entry point is auto-discovered with
zero imports in user code. This is how `spacy-transformers` and every packaged model
plug in: **the plugin boundary is a string name, not a code dependency.**

Two forward-compatibility patterns worth stealing:

- **Versioned names.** Implementations are registered as `"spacy.Tagger.v2"`,
  `"spacy.HashEmbedCNN.v2"`. Behavior changes get a new version; configs pin the old
  one and keep working.
- **Legacy fallback.** `registry.get` falls back from `spacy.X` to `spacy-legacy.X`
  (`util.py:228-301`) — removed implementations move to a legacy package rather than
  breaking every serialized config that references them.

## 3. Schema validation: strict where it protects, open where it extends

Config sections are validated by pydantic models (`spacy/schemas.py:355-448`):

- `StrictInt` / `StrictStr` — no silent type coercion;
- `extra = "forbid"` on framework-owned sections — typos are errors, not silently
  ignored keys;
- `extra = "allow"` only on deliberately user-extensible sections (`[paths]`);
- **schemas declare no defaults** — every field is required; the defaults live in the
  checked-in `default_config.cfg`, and a test asserts the two stay in sync
  (`schemas.py:347-353`). One source of truth for defaults, one for shapes.

## 4. Composition and transfer, declared not coded

- **Sourcing**: `[components.ner] source = "en_core_web_sm"` reuses a trained
  component from another pipeline (loaded once, vocab shared, compatibility
  checked) — components are portable units.
- **`frozen_components`** — present in the pipeline, annotates during training, but
  never updated or re-initialized. **`annotating_components`** — runs during training
  so downstream components see its output. Fine-tuning vs. transfer vs. from-scratch
  are config differences, not code differences.

## 5. Artifacts are self-describing packages

`Language.to_disk` (`language.py:2132-2160`) writes: `config.cfg` (the functional
spec), `meta.json` (descriptive metadata: versions, performance, sources), one
directory per component (weights/state), and `vocab/`. `spacy package` wraps this
into a pip-installable package that advertises itself via an entry point and pins a
compatible framework version range. Anyone can inspect *what this artifact is and
how it was made* without loading it.

## For levelset

1. **Define a `RunConfig` — one JSON document that fully describes a leveling run.**
   Today a run is assembled imperatively (build constraint objects, build a scorer,
   call `streamFromFactory`). Add the declarative layer above it:

   ```jsonc
   {
     "levelset": ">=0.4 <0.5",
     "seed": 42,
     "search": { "use": "levelset.SerialSGS.v1" },
     "constraints": [
       { "use": "levelset.MaxConcurrentResource.v1", "name": "carpenters-cap",
         "resourceUniqueId": 100, "max": 3 },
       { "use": "levelset.ConcurrentUnitsLimit.v1", "name": "zone-wip",
         "discipline": 200, "max": 2, "units": "$refs.units" }
     ],
     "scorers": [
       { "use": "levelset.Makespan.v1", "weight": 1.0 },
       { "use": "levelset.OpenUnitPenalty.v1", "weight": 0.3,
         "softMax": 2, "units": "$refs.units" }
     ],
     "refs": { "units": [ { "id": 10, "taskUniqueIds": [1, 2, 3] } ] }
   }
   ```

   The `Constraint` discriminated union already *is* config-as-data — this extends
   the property to scorer blocks and the search itself, plus dot-path refs
   (`$refs.units`) so shared structures like unit definitions are defined once, the
   way spaCy's `corpora.train` is referenced, not inlined. A `runFromConfig(project,
   config)` / `configFromRun(...)` pair gives you spaCy's lossless round trip, and
   makes runs diffable, storable, and buildable by a UI or an LLM — directly serving
   the LLM-assisted-optimization goal in the literature review.

2. **Version every registered name now, while the API is churning.** The README
   already warns the leveling API may change before 1.0, and `ConcurrentUnitsLimit`
   already "subsumes the former LaydownSpaceCap" — exactly the evolution versioned
   names absorb. Register blocks/searches as `levelset.OpenUnitPenalty.v1`; when
   semantics change, ship `.v2` and keep `.v1` resolving (in-tree or in a
   `levelset-legacy` module, as spaCy does). Saved run configs from March must still
   produce the same schedule in September. An alias entry (`LaydownSpaceCap.v1` →
   `ConcurrentUnitsLimit.v1` adapter) beats a breaking rename.

3. **A registry keyed by string, open to plugins.** A minimal
   `Map<string, BlockFactory>` with `register()`/`get()` per kind (constraints,
   scorers, searches, readers, writers) is enough — the payoff is that the planned
   CP-SAT / MiniZinc backend becomes a *registration* (`levelset.CpSat.v1` as a
   `search` entry) rather than a fork of the run API, and third-party constraint
   packages can register without touching core. Keep spaCy's split: the registry
   holds *factories* (validate config → produce constraint/scorer), never live
   instances.

4. **Zod discipline, spaCy-style.** You already validate untrusted `ProjectFile`
   data with Zod transforms. Apply the same to `RunConfig` with spaCy's two rules:
   `.strict()` on framework-owned shapes so a typo'd `softmax` (for `softMax`) is an
   error rather than a silently-ignored key and an unconstrained run; defaults live
   in each block's `defaultConfig` (doc 02) and are *filled into* the config — then
   the **filled** config is what you persist.

5. **Embed provenance in every materialized schedule.** spaCy ships `config.cfg` +
   `meta.json` inside every model directory. Levelset's equivalent: when
   `materialize` writes a leveled `ProjectFile` (and when writers export it), attach
   the filled run config, the levelset version, the seed, scorer values achieved,
   and `unsupportedConstraints` — in JSON output as a `levelset` metadata block, in
   MSPDI/XLSX as a summary sheet or project-level custom field. Six months later,
   "why does floor 3 start in June?" is answerable from the file itself: which
   constraints, which weights, which engine version. This is the single
   highest-leverage practice in this document.

6. **Freezing as config.** Re-leveling a live project must not move in-progress
   tasks. That's spaCy's `frozen_components`: express it declaratively
   (`"frozen": { "taskUniqueIds": [...] }` or "freeze anything with actual work")
   in the `RunConfig`, compiled to `Release`-style bounds internally — so "re-level
   the remainder" and "level from scratch" are the same code path with different
   config, not two engines.
