# 01 — Pipeline architecture: how spaCy orchestrates components

How `Language` (the `nlp` object) manages an ordered set of components, applies them
to documents, handles failures, streams input, and validates pipelines statically.
Primary sources: `spacy/language.py`, `spacy/pipe_analysis.py`.

## 1. The pipeline is a flat, ordered list of named callables

The entire pipeline state is two fields (`spacy/language.py:217-218`):

```python
self._components: List[Tuple[str, PipeCallable]] = []   # ordered (name, callable)
self._disabled: Set[str] = set()                        # names that are loaded but inactive
```

There is no graph, no DAG scheduler, no dependency injection container at runtime.
Execution is a fold (`language.py:1020-1061`):

```python
for name, proc in self.pipeline:
    doc = proc(doc)
    if not isinstance(doc, Doc):
        raise ValueError(Errors.E005.format(name=name, returned_type=type(doc)))
```

Two things carry all the weight:

- **A uniform contract** — every component is `Doc -> Doc`, checked *at runtime after
  every component* (error `E005` names the offender). Any function with that shape is
  a valid component; classes, closures, and rule-based or ML components are
  indistinguishable to the orchestrator.
- **Instance names distinct from factory names.** You can `add_pipe("ner", name="ner_products")`
  and `add_pipe("ner", name="ner_locations")` — two instances of one factory, each with
  its own config, addressable by name for removal, replacement, disabling, and error
  attribution.

Ordering is first-class: `add_pipe` takes exactly one of `before` / `after` / `first`
/ `last` (name or integer index), and raises `E006` if you pass two
(`language.py:838-891`).

### Encapsulation via frozen views

Every public collection (`nlp.pipeline`, `nlp.pipe_names`, `nlp.components`,
`nlp.disabled`) is a `SimpleFrozenList` that raises a *teaching* error on mutation —
`E926`: "It looks like you're trying to modify `nlp.pipeline` directly… Use
`nlp.add_pipe` instead" (`language.py:357-366`). All mutation funnels through
`add_pipe` / `remove_pipe` / `rename_pipe` / `replace_pipe`, which keep the
per-component metadata, config, and cross-component wiring in sync. Notably,
`replace_pipe` is implemented as remove + add at the same index rather than in-place
mutation, "to make sure the configs are handled correctly" (`language.py:929-930`).

### Resident vs. active: three distinct levers

spaCy deliberately separates:

- **`exclude`** — never loaded at all (skipped in `from_config`, `language.py:1887`);
- **`disable`** — loaded, present in `_components`, but skipped during execution;
  reversible in O(1) via `enable_pipe` (`language.py:998-1018`);
- **per-call `disable`** — `nlp(text, disable=["parser"])` for one invocation.

`select_pipes(enable=..., disable=...)` returns a context manager (`DisabledPipes`,
`language.py:2341-2364`) that restores state on exit — temporary reconfiguration
without rebuild.

## 2. Errors are attributed, coded, and pluggable

The error-handler contract is a single callable shape used at every level
(`spacy/util.py:1753-1786`):

```python
handler(component_name: str, component, docs: List[Doc], exception) -> None
```

- The default is `raise_error` (just re-raise); `ignore_error` (swallow and skip the
  doc) ships as a ready-made alternative for "keep the stream alive" workloads.
- `nlp.set_error_handler(f)` sets the pipeline default *and* propagates to every
  component that supports it; components can also override individually via
  `get_error_handler`/`set_error_handler` (`spacy/pipeline/pipe.pyx:116-137`).
- Ambiguous low-level failures are rewritten into actionable ones: a `KeyError`
  inside a component becomes `E109` — "Component '{name}' could not be run. Did you
  forget to call `initialize()`?" (`language.py:1054-1055`).
- Every error has a stable code (`spacy/errors.py`), which makes failures
  searchable, testable, and documentable.

## 3. Streaming: lazy, batched, order-preserving

`nlp.pipe(texts)` (`language.py:1536-1619`) builds a *chain of generators*, one per
component. Each component is wrapped so that:

- if it implements its own `.pipe(docs, batch_size=...)`, that streaming/batching
  implementation is used (batching policy lives **inside** the component);
- otherwise the framework falls back to per-doc `__call__` with the same
  error-handler protocol (`util.py:1753-1778`).

`as_tuples=True` threads arbitrary per-item context through the whole pipeline:
`(text, context)` pairs are unzipped, the context rides along on the doc, and pairs
are re-zipped on output (`language.py:1564-1580`).

With `n_process > 1` (`language.py:1636-1738`), spaCy makes parallelism invisible:

- docs are serialized to bytes across process boundaries (cheaper than pickle);
- work is distributed round-robin and output channels are cycled so **results come
  back in input order** — parallelism never changes observable results;
- a `_Sender` implements backpressure (send two batches ahead, refill one per batch
  consumed) so **infinite input streams run in bounded memory**;
- worker crashes surface in the parent as a coded error (`E871`) instead of a hang.

For long-running services there's `nlp.memory_zone()` (`language.py:2100-2130`): a
context manager that scopes all transient allocations (interned strings, cache
entries) across vocab, tokenizer, and every component, freeing them at exit — an
explicit answer to "my process grows forever."

## 4. Static pipeline validation: declare contracts, check before running

Every factory declares metadata (`FactoryMeta`, `language.py:2325-2338`):

```python
@Language.factory("tagger", assigns=["token.tag"], requires=[], retokenizes=False, ...)
```

`validate_attrs` (`spacy/pipe_analysis.py:17-60`) checks the declared strings are
real attributes of the data model at registration time. `nlp.analyze_pipes()`
(`pipe_analysis.py:81-113`) then walks the pipeline **in order** and, for each
component, checks whether each `requires` attribute is assigned by any *preceding*
component — a requirement satisfied only by a later component is still reported as a
problem. Mis-ordered pipelines are caught without running any model.

## For levelset

**Distinguish your two composition levels.** Levelset's top-level flow
(`ProjectFile → ResolvedProject → ScheduleStream → Schedule → ProjectFile`) is an
*assembly line* of typed transforms — TypeScript makes each stage's contract explicit
in the type system, which is strictly better than spaCy's runtime `isinstance`
check. Keep that. The spaCy lessons apply to the level *inside* the search stage,
where constraints and scorer blocks are the "components": many independently-authored
units, uniform ADT (`Constraint` discriminated union / `Scorer` interface), composed
per run. Concretely:

1. **Name block instances, not just kinds.** A run with two `ConcurrentUnitsLimit`
   constraints (one per discipline) needs each addressable for error attribution,
   toggling, and reporting. Give every constraint/scorer instance an optional `name`
   (defaulting to its `kind`), the way spaCy separates factory name from instance
   name. When `serialSGS` rejects a placement or a schedule comes back infeasible,
   report *which named constraint* bound — that's spaCy's "attribute every failure
   to a component by name," and it's the difference between debuggable and opaque
   scheduling.

2. **Adopt the three-lever enable model.** You already have hard constraints
   (enforced), annotations (recorded, unenforced), and simply-absent constraints.
   Make the middle state a first-class, reversible toggle: a run config should be
   able to say "this constraint is present but disabled" without deleting it —
   useful for what-if comparisons (`bestBy` with and without a WIP cap) exactly like
   spaCy's `select_pipes` context manager enables ablation without rebuilding.

3. **Static run analysis before searching.** Constraints reference project data by
   ID (`resourceUniqueId`, `taskUniqueIds`); scorers reference units. Build an
   `analyzeRun(resolved, constraints, scorers)` that validates *before* the search:
   every referenced ID exists; `UnitPrecedence` doesn't contradict task `Precedence`
   edges; a `Deadline` isn't earlier than a `Release`; units referenced by
   `OpenUnitPenaltyBlock` have non-empty `taskUniqueIds`. This is `analyze_pipes` +
   `validate_attrs`: the metadata already exists in your discriminated union — the
   missing piece is the order-aware/consistency-aware checker that runs in
   milliseconds instead of failing (or worse, silently mis-optimizing) after a long
   search.

4. **Error codes with actionable messages.** Levelset already does this well for old
   MPP versions ("only MPP14+ is supported"). Systematize it: a `LEVELSET_E###`
   catalog, with messages that state the fix ("Constraint 'zoneA-wip' references
   taskUniqueId 42 which is not in the project — was the task filtered out by
   `includeSummaryTasks: false`?"). Coded errors are testable and documentable;
   string-matched errors are neither.

5. **Defend `ScheduleStream`'s laziness and plan for order.** The generator-chain
   design is already spaCy-shaped. Two commitments to make now, before a
   multi-candidate search (restart/LDS/LNS) lands: (a) **determinism** — a seeded
   run must yield the same stream of schedules; (b) **order preservation under
   parallelism** — if candidate generation ever fans out to workers, reassemble in
   deterministic order like `nlp.pipe(n_process=N)` does, so `bestBy` tie-breaking
   and `take(n)` are reproducible. Also add a pluggable per-candidate error policy:
   when one SGS run throws (degenerate calendar, contradictory constraints), the
   stream should be able to skip-and-record rather than die, mirroring
   `raise_error` vs. `ignore_error`.

6. **Backpressure is your memory-zone.** A lazy stream feeding `bestBy` is
   already bounded-memory. Keep materializers incremental (fold, don't collect) so
   an LNS search emitting thousands of candidates never needs them all resident —
   the same property spaCy's `_Sender` protects for infinite text streams.
