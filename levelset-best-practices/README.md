# spaCy pipeline best practices → levelset

A study of spaCy's pipeline architecture (from this repository's source), distilled
into design guidance for [levelset](https://tangled.org/russ.fugl.dev/levelset)'s
resource-leveling pipeline:

```
ProjectFile ──resolveCalendar──▶ ResolvedProject ──serialSGS.run(constraints)──▶
  ScheduleStream ──bestBy(scorer)──▶ Schedule ──materialize──▶ ProjectFile
```

spaCy is one of the most battle-tested pipeline frameworks in production use. Its
problem shape is surprisingly close to levelset's: a canonical data structure flows
through an ordered sequence of composable, independently-authored components; the
result must round-trip back to the input format; runs must be reproducible; and
third parties must be able to plug in new components without touching the core.

## The documents

| Doc | Topic | spaCy source studied |
|---|---|---|
| [01-pipeline-architecture.md](./01-pipeline-architecture.md) | Orchestration: ordered named components, uniform contracts, error handling, streaming, static validation | `spacy/language.py`, `spacy/pipe_analysis.py` |
| [02-component-design.md](./02-component-design.md) | Component lifecycle: pure predict vs. mutation, factories, pluggable scorers, data-driven initialization, shared derived data | `spacy/pipeline/pipe.pyx`, `trainable_pipe.pyx`, `tok2vec.py`, `factories.py` |
| [03-config-and-registry.md](./03-config-and-registry.md) | Declarative config as source of truth, registries, versioned names, schema validation, reproducible artifacts | `spacy/util.py`, `spacy/default_config.cfg`, `spacy/schemas.py` |
| [04-data-contract.md](./04-data-contract.md) | The shared data structure: one owner/many views, derived data, namespaced extensions, exclusive vs. overlapping annotations, serialization | `spacy/tokens/doc.pyx`, `underscore.py`, `_serialize.py`, `spacy/training/example.pyx` |

Each document explains the spaCy mechanism (with `file:line` references into this
repo), the design principle it embodies, and a **"For levelset"** section applying
it to the leveling toolkit.

## Concept map

| spaCy | levelset | Notes |
|---|---|---|
| `Doc` | `ProjectFile` / `ResolvedProject` / `Schedule` | The data spine. spaCy uses *one* mutable structure end-to-end; levelset uses typed stages — see doc 04 for the tradeoff |
| `Tokenizer` | `readMpp` / `readMspdi` / `readJson` | Raw input → canonical structure. spaCy's tokenization is famously non-destructive (lossless round-trip) — the same property `materialize` + writers need |
| Pipeline component (`tagger`, `ner`, …) | Constraint / scorer / search step | Small unit with a declared contract, composed into a run |
| `@Language.factory` + `default_config` | `*Block.apply(config)` | A named, configurable factory producing a component instance |
| `assigns` / `requires` metadata | (proposed) per-block `reads` / `writes` declarations | Enables static validation of a constraint set before running the search |
| `nlp.analyze_pipes()` | (proposed) `analyzeRun(project, constraints, scorers)` | Catch mis-ordered / unsatisfiable setups without running |
| `predict` / `set_annotations` split | `Scorer.score` (pure) vs. `materialize` (writes) | Levelset already has this shape — doc 02 explains why to defend it |
| `Tok2Vec` listener (shared embeddings) | (proposed) shared per-day profiles (resource histograms, open-unit counts) | Compute expensive derived data once per schedule; many scorers read it |
| `default_score_weights` | Scorer weights / `paretoFrontier` | Multi-objective combination declared as data |
| `config.cfg` saved with every model | (proposed) run config embedded in every materialized schedule | Reproducibility comes from persisting the *filled* config with the artifact |
| `registry` + entry points | (proposed) named block/backend registries | `"levelset.OpenUnitPenalty.v1"` referenced from config; CP-SAT/MiniZinc backends plug in by name |
| `doc.ents` (exclusive) vs. `doc.spans` (overlapping) | Enforced constraints vs. `unsupportedConstraints` annotations | Different guarantees deserve different structures |
| `Example` (predicted + reference docs) | (proposed) baseline vs. leveled schedule pair | Score/diff both sides with the same accessors |
| `frozen_components` | (proposed) locked in-progress tasks during re-leveling | "Don't re-initialize what's already running" as config, not code |
| `nlp.pipe()` streaming + order preservation | `ScheduleStream` | Lazy iterables; parallelism must not change observable results |

## The ten lessons that matter most

1. **One uniform component contract, enforced at runtime.** Everything in spaCy's
   pipeline is `Doc -> Doc`; the framework checks the return type after every
   component and attributes failures to the component *by name*.
2. **Declare data dependencies as metadata, validate statically.** Components say
   what they `assign` and `require`; `analyze_pipes` catches ordering bugs without
   running a model.
3. **Keep prediction pure; confine mutation to one place.** `predict` never touches
   the doc; `set_annotations` is the only writer. Batching, training, scoring, and
   speculative evaluation all fall out of this split.
4. **Configuration is data, resolved through a registry.** A whole pipeline is
   reconstructable from one declarative file; implementations are referenced by
   *versioned string names* so old configs keep working as code evolves.
5. **Persist the fully-expanded config with every artifact.** Reproducibility comes
   from saving filled-in defaults next to the output, not from re-deriving defaults
   at load time.
6. **Never store what you can reconstruct.** spaCy stores no text at all — it
   rebuilds it from token lengths and a whitespace bit. Minimal primitives in, derived
   views out.
7. **Namespace third-party data and fail loudly on collision.** Custom attributes
   live under `._.` with registration that rejects duplicates unless forced.
8. **Model exclusive vs. overlapping facts with different structures.** Entities are
   per-token IOB codes (overlap structurally impossible); free-form span groups live
   in a separate side structure.
9. **Errors are a product surface.** Every error has a code and an actionable
   message ("Did you forget to call `initialize()`?"); error handlers are pluggable
   per component.
10. **Parallelism must be invisible.** `nlp.pipe(n_process=4)` reassembles results
    in input order; an optimization never changes observable output.

## Quick checklist for levelset

- [ ] Give every block/constraint kind a **versioned registry name** (`levelset.PeakCap.v1`) and reference it from a serializable run config (doc 03).
- [ ] Add `reads`/`writes` **contract metadata** to constraints and scorer blocks; ship an `analyzeRun()` that validates a run before searching (docs 01, 02).
- [ ] Embed the **filled run config + engine version + seed** in every materialized `ProjectFile` / exported schedule (doc 03).
- [ ] Keep scorers **pure over `Schedule`**; compute shared per-day profiles once and let scorers read them (doc 02).
- [ ] Make `materialize` **round-trip-preserving**: fields the leveler didn't touch must survive read → level → write unchanged, with tests (doc 04).
- [ ] Split "constraint recorded as annotation" from "constraint enforced" **structurally**, not just by a flag — and expose a `hasEnforced(kind)` query (doc 04).
- [ ] Attribute every search/constraint failure to the **named block instance** that caused it; adopt error codes with actionable messages (doc 01).
- [ ] Preserve **determinism and ordering** in `ScheduleStream` when you add parallel/multi-candidate search (doc 01).

---

*Generated from a source-level study of spaCy at this repository's checkout
(spaCy 3.8.x). File and line references point into this repo.*
