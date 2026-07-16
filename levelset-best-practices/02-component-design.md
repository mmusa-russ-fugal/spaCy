# 02 — Component design: lifecycle, purity, factories, shared computation

How spaCy structures individual pipeline components so they compose, batch, train,
score, and serialize uniformly. Primary sources: `spacy/pipeline/pipe.pyx`,
`spacy/pipeline/trainable_pipe.pyx`, `spacy/pipeline/tok2vec.py`,
`spacy/pipeline/factories.py`.

## 1. Two-tier base classes: don't force ML machinery on simple components

- **`Pipe`** (`pipe.pyx`) is the minimal contract: `__call__`, a default streaming
  `pipe()`, a no-op `initialize()`, a generic `score()`, `labels`, and pluggable
  error handlers. A bare `Doc -> Doc` function registered with
  `@Language.component` satisfies it with zero boilerplate
  (`spacy/pipeline/functions.py:14-33`).
- **`TrainablePipe`** (`trainable_pipe.pyx`) layers on the ML lifecycle: `predict`,
  `set_annotations`, `update`, `get_loss`, `initialize`, `add_label`, and generic
  serialization.

Rule-based components (`Sentencizer`, `merge_noun_chunks`, rulers) live happily on
the small interface; trainable ones opt into the big one. Nothing pays for
machinery it doesn't use.

## 2. The predict / set_annotations split — the central pattern

`TrainablePipe` implements `__call__` and `pipe` *once*, in terms of two abstract
halves (`trainable_pipe.pyx:40-79`):

```python
def __call__(self, doc):
    scores = self.predict([doc])          # PURE: never mutates docs
    self.set_annotations([doc], scores)   # the ONLY place docs are written
    return doc

def pipe(self, stream, *, batch_size=128):
    for docs in util.minibatch(stream, size=batch_size):
        scores = self.predict(docs)       # one vectorized call over the batch
        self.set_annotations(docs, scores)
        yield from docs
```

Why this split earns its keep:

1. **Batching lives in the base class.** Every component is automatically
   batch-capable; single-doc is just N=1. Components never reimplement the loop.
2. **Purity makes reuse safe.** The same `predict` serves inference, training,
   scoring, and speculative evaluation — because it has no side effects, calling it
   never corrupts state, and it can be parallelized.
3. **Numeric output is decoupled from domain interpretation.** `predict` returns raw
   scores; `set_annotations` turns them into domain facts (`argmax → label → token
   field`). Each half is testable alone.

Even the *rule-based* `Sentencizer` adopts the split purely for structure
(`sentencizer.pyx:64-120`) — "prediction" is punctuation logic, but keeping
compute-then-write discipline pays regardless of whether a model is involved.

## 3. Factories: construction is declarative, injection is by config

Components are built by registered factory functions, never by direct construction
(`factories.py:436-453`):

```python
Language.factory(
    "tagger",
    assigns=["token.tag"],                                # data contract
    default_config={
        "model": DEFAULT_TAGGER_MODEL,                    # nested @architectures reference
        "overwrite": False,
        "scorer": {"@scorers": "spacy.tagger_scorer.v1"}, # scoring is injected, not hardcoded
    },
    default_score_weights={"tag_acc": 1.0},               # how metrics roll up
)(make_tagger)
```

- The factory function (`make_tagger(nlp, name, model, overwrite, scorer, ...)`) is a
  thin translator from resolved config to constructor arguments — defaults and
  dependency wiring stay out of the class body.
- The `scorer` is a **registry-named injected callable** stored on the instance; the
  generic `Pipe.score()` (`pipe.pyx:71-90`) calls it with `cfg` + `labels` + kwargs.
  Users swap scoring via config, without subclassing.
- `default_score_weights` declares how each metric contributes to the single
  aggregate score used for model selection (`1.0` = primary, `0.0` = tracked,
  `None` = reported but unweighted). Multi-objective combination is **data**, not
  code.

## 4. initialize(): infer from data, cache what's expensive

`initialize(get_examples, *, nlp, labels=None)` is where a component meets real data
before the first run (`tagger.pyx:242-278`):

- `get_examples` is a **zero-arg, re-callable** callback returning fresh examples —
  validated up front (`validate_get_examples`) to fail early with a clear error.
- Labels are **inferred from the data** (scrape gold tags, `sorted()` for
  deterministic indices) unless explicitly provided — the override exists so an
  offline `init labels` step can precompute them and later runs skip the corpus
  scan.
- Model dimensions are inferred from a small real sample (`islice(get_examples(), 10)`)
  rather than hand-specified shapes.
- Components expose `labels` (runtime tuple) separately from `label_data` (a minimal
  JSON blob sufficient to recreate the label set), decoupling "compute once" from
  "use many times."

## 5. Shared expensive computation: the listener pattern

Several components need the same expensive intermediate (token embeddings). spaCy's
solution (`tok2vec.py`):

- A **provider** (`Tok2Vec`) computes the shared representation once per batch and
  writes it to a well-known slot on the doc (`doc.tensor`).
- **Consumers** embed a proxy (`Tok2VecListener`) that, at predict time, just *reads*
  `doc.tensor` — so consumers depend only on the data slot, not on the provider
  object.
- The **container wires them** (`Language._link_components`,
  `language.py:1740-1760`) — not the components themselves, because components can't
  see the pipeline during deserialization.
- During training, gradients from N consumers **accumulate** into the shared
  representation and backprop runs once (`tok2vec.py:164-186`); a batch-content hash
  guards against consuming stale shared state (`E953`).
- An escape hatch (`replace_listeners`, `language.py:1996-2098`) converts a shared
  dependency into an owned private copy when coupling becomes wrong (frozen
  components).

## For levelset

1. **Levelset already has the purity split — defend it as an invariant.** `Scorer.score(s)`
   is pure over `Schedule`; `materialize` is the only writer back into `ProjectFile`;
   `serialSGS` emits schedules without touching the input. Write this down as a
   documented contract (and enforce with `Readonly<Schedule>` in scorer signatures):
   *scorers and constraint predicates never mutate; only `materialize` writes.* Every
   future feature that tempts a scorer to cache onto the schedule object or a
   constraint to "fix up" a placement should lose to this rule. It's what keeps
   `paretoFrontier` (many scorers over one schedule) and future parallel search safe.

2. **Use the listener pattern for per-day profiles.** Your scorer blocks
   (`ConcurrentResourceCostBlock`, `OpenUnitPenaltyBlock`, `HiringLagPenaltyBlock`,
   `UnimodalDeviationBlock`) all derive from the same intermediates: per-day resource
   histograms and per-day open-unit counts. Computed independently by each scorer,
   that's O(scorers × days × tasks); computed once, it's O(days × tasks) plus cheap
   reads. Mirror spaCy exactly: define well-known derived slots
   (`schedule.profiles.resourceHistogram`, `schedule.profiles.openUnits`) computed
   lazily once per schedule (the "provider"), and have scorer blocks read the slot
   (the "listeners"). Let the *runner* — not each block — own when profiles are
   built, since blocks can't see each other. This matters most once a
   multi-candidate search evaluates thousands of schedules.

3. **Keep the two-tier component model.** A `Scorer` is already minimal — a name, a
   direction, and a pure function; anyone can write one inline. Blocks are the rich
   tier: configured factories that emit a scorer *and* a MiniZinc fragment. Preserve
   the property that the small interface never requires the big one: users shouldn't
   need to build a Block (or think about MiniZinc) to try a one-off scorer, just as a
   spaCy user can register a bare function without touching `TrainablePipe`.

4. **`Block.apply(config)` is your factory — finish the pattern.** spaCy factories add
   three things worth copying: (a) a **declared `defaultConfig`** merged under the
   user's partial config, so blocks are callable with minimal args and the *effective*
   config is always complete and serializable; (b) **validation at construction**
   (Zod-parse the merged config inside `apply`, not just at the untrusted-JSON
   boundary); (c) **declared contract metadata** — which schedule facts the block
   reads (`resourceHistogram`, `units`) and, for constraint blocks, which `Constraint`
   kinds it emits — feeding the static `analyzeRun` from doc 01.

5. **Declare score weights as data.** `bestBy(scorer)` takes one scorer today.
   Multi-objective runs will want spaCy's `default_score_weights` shape: a
   `WeightedScorer` combinator built from `{ makespan: 1.0, wipPenalty: 0.3, hiringLag: null }`
   where `null` means "compute and report, but don't optimize on it." Reported-but-
   unweighted metrics are how you watch a tradeoff before committing to it — and the
   weight map serializes into the run config (doc 03) while a hand-composed closure
   doesn't.

6. **An `initialize` phase, data-driven with a cache override.** `resolveCalendar` is
   already spaCy-shaped initialization (derive the day-index bitmap from data once,
   O(1) queries after). Extend the idea: derive unit membership, resource pools, and
   topological order from the `ProjectFile` in one validated preparation step, and —
   like `labels` vs. `label_data` — make each derivation accept a precomputed value so
   repeated re-leveling of the same project (the interactive loop) skips the scan.
   Validate the "examples" up front: empty project, tasks with no calendar, cyclic
   precedence — fail here with coded errors, never mid-search.
