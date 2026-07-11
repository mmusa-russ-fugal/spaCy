# 04 — The data contract: one spine, derived views, lossless round-trips

How spaCy designs the `Doc` — the single data structure every component reads and
writes — and what its choices teach about `ProjectFile`, `Schedule`, and the
boundary between them. Primary sources: `spacy/tokens/doc.pyx`,
`spacy/tokens/underscore.py`, `spacy/tokens/_serialize.py`,
`spacy/training/example.pyx`, `spacy/strings.pyx`.

## 1. One owner, many views

A `Doc` owns a single contiguous C array of token structs; `Token` and `Span` are
**cheap views** created on demand — "they don't own the data themselves"
(`doc.pyx:130-146`). Entities, sentences, and noun chunks are all *computed
projections* over the one array. There is exactly one source of truth, and every
mutation flows through it.

Supporting choices:

- **Interned integers, not strings.** Every token attribute is a 64-bit hash into a
  shared `StringStore` (`strings.pyx:62-68`); strings are content-addressed, so the
  same value costs memory once and identity is stable across documents and
  processes. A shared `Vocab` stores per-*type* data (the word "the": one lexeme,
  not 10,000 copies).
- **Relative references.** A token's syntactic head is stored as a *relative* offset
  (`doc.pyx:302`), making token arrays position-independent and mergeable.
- **Never store what you can reconstruct.** There is no text field anywhere. The
  document text is rebuilt from token lengths plus a per-token "space follows" bit
  (`doc.pyx:724-730, 956-964`). Tokenization is therefore *non-destructive by
  construction*: the original input is always losslessly recoverable.

## 2. Namespaced extensions: third parties get a sandbox

Custom attributes go through a registry (`Doc.set_extension` →
`underscore.py:106-124`):

- exactly one of `default` / `getter` / `method` must be provided — the shape is
  validated at registration;
- re-registering an existing name raises `E090` unless `force=True` — two plugins
  cannot silently clobber each other's `._.sentiment`;
- all extension values for Doc, Token, *and* Span are stored in **one container**,
  `doc.user_data`, under namespaced keys `("._.", name, start, end)`
  (`underscore.py:92-93`) — so custom data automatically travels with the Doc
  through copies and serialization;
- mutable defaults are copied per object on first access (`underscore.py:67-71`) —
  the shared-mutable-default bug is handled in the framework, once.

Behavior overrides (`user_hooks`: replace `similarity`, `sents`, …) are kept
**separate from data** and are deliberately *not* serialized — hooks are code, and a
warning fires if you serialize a doc that has them (`W109`).

## 3. Exclusive vs. overlapping annotations get different structures

- **`Doc.ents`** — canonical named entities — are stored as per-token IOB codes on
  the token structs themselves. Overlap is *structurally impossible*, and `set_ents`
  enforces single ownership of every token (`E1010`, `doc.pyx:833-836`). The
  encoding also distinguishes "definitely not an entity" from "unknown"
  (`doc.pyx:119-127`) — absence of annotation and negative annotation are different
  facts.
- **`doc.spans`** — named `SpanGroup`s stored *beside* the token array — hold
  arbitrary, freely-overlapping span sets (`span_group.pyx`), as many named layers
  as you like.

One representation guarantees exclusivity by construction; the other permits
overlap by construction. spaCy never uses a runtime flag where a structural
guarantee can do the job.

**Signaling what's been set:** `Doc.has_annotation("TAG", require_complete=...)`
(`doc.pyx:431-472`) gives components a uniform way to ask "has someone already done
this?" — replacing a proliferation of ad-hoc booleans (the old `is_tagged` /
`is_parsed` flags are deprecated shims onto it).

## 4. Serialization: columnar, deduplicated, opt-in extras

`DocBin` (`_serialize.py:29-49`) stores a whole corpus as: one flat integer matrix
of all docs' tokens + a `lengths` array to split them apart + **each unique string
once for the entire bin**, gzipped. Packing more docs together *improves*
compression. `user_data` is opt-in (`store_user_data=False` by default), and
type-sensitive keys survive because tuples-vs-lists are handled explicitly
(`doc.pyx:1388-1408`). Every serializer takes an `exclude` list.

## 5. Predicted and reference share one structure

Training pairs two Docs in an `Example` — `x` (what the model produced) and `y`
(gold) (`example.pyx:79-86`). Because both sides are the *same type*, every accessor,
scorer, and diff tool works on both. Token alignment between them is computed
lazily and cache-invalidated by a cheap hash over the raw arrays
(`example.pyx:135-150`).

## For levelset

1. **`ProjectFile` is the spine; keep `Schedule` a thin overlay of IDs and days.**
   spaCy's discipline — views reference the owner, never copy it — is the right shape
   for `Schedule`: `{ taskUniqueId → startDay }` plus a reference to the
   `ResolvedProject`, with finishes, slack, histograms, and makespan *derived*.
   Storing derived values on the schedule invites the drift bug (a start moves, the
   histogram doesn't); deriving them (memoized, per doc 02's profiles) makes staleness
   impossible. It also makes candidate schedules cheap — a multi-candidate search
   holding 10,000 candidates holds 10,000 small maps, not 10,000 project copies —
   which is exactly `DocBin`'s "shared strings stored once" economics applied to
   `ScheduleStream.collect()` and Pareto archives.

2. **Day-indexing is your interning — extend the pattern.** `resolveCalendar`'s
   bitmap + prefix sum is precisely spaCy's move of converting strings to integers
   once so every downstream operation is array math. Apply it wherever the search is
   hot: map `taskUniqueId`/`resourceUniqueId` to dense indices in `ResolvedProject`
   so constraint checks index arrays instead of hashing IDs, and keep sparse
   real-world IDs at the boundary (like `StringStore`: hash at the edge, integers
   inside).

3. **Make the round trip a tested invariant.** spaCy's most famous data-contract
   property is non-destructive tokenization: nothing about the input is lost. The
   levelset equivalent: **read → level → write must preserve every field the leveler
   didn't change** — MPP custom fields, notes, WBS codes, baseline data, calendar
   exceptions. Concretely: (a) `materialize` should only ever *update dates and
   leveling-delay fields* on a copy of the original `ProjectFile`, never rebuild one
   from the schedule; (b) carry reader-preserved unknowns (an `extensionData` bag on
   tasks/resources, like `user_data`) through to writers; (c) add round-trip tests —
   `readMspdi(writeMspdi(readMspdi(x)))` deep-equals, and a leveled write-back diffs
   from the original *only* in scheduling fields. Users are trusting you with their
   project files; "we only touched the dates" is the promise that makes leveling
   adoptable.

4. **Namespace annotations on schedules and project files.** `unsupportedConstraints`
   is the first of many side-channel annotations (solver stats, per-constraint
   binding info, block-emitted diagnostics, future backend artifacts). Give
   `Schedule` one `annotations` container keyed by namespaced strings
   (`"levelset/unsupportedConstraints"`, `"myplugin/crewNotes"`), with a
   register-once/collide-loudly rule like `E090`. And keep spaCy's code/data split:
   scorers and constraint *functions* never serialize — their **config** does
   (doc 03); anything in `annotations` must be plain JSON.

5. **Exclusive vs. advisory, structurally.** Levelset already discovered spaCy's
   ents-vs-spans distinction: constraints `serialSGS` *enforces* shape the schedule
   itself; constraints it can't enforce become *annotations*. Sharpen the contract:
   the set of enforced-kind names should be a queryable property of the search
   backend (`serialSGS.supports(kind)`), the split should happen in one place before
   the run, and the result should expose `schedule.hasEnforced("PeakCap")` — the
   `has_annotation` pattern — so downstream consumers (and tests) can *assert* a
   guarantee rather than assume it. When the CP-SAT backend lands, the same run
   config enforces more kinds and the annotations shrink; callers checking
   `hasEnforced` keep working unchanged. Also steal the three-state insight
   (missing ≠ outside): "constraint not given" and "constraint given and verified
   non-binding" are different facts worth distinguishing in reports.

6. **Pair baseline and leveled schedules like `Example`.** Re-leveling is inherently
   comparative: the original plan vs. the proposal. Represent that as a first-class
   pair `{ baseline: Schedule, leveled: Schedule }` over the same
   `ResolvedProject`, so scorers can run on both sides with the same code and
   "disruption" scorers (how many tasks moved, total displacement-days, changed
   crew assignments) are natural to write. That enables the regression test spaCy's
   `Example` enables: assert a proposed schedule never scores worse than baseline on
   the metrics you promised to respect.
