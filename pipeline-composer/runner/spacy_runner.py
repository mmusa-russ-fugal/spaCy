"""Shared pipeline runner for the spaCy Pipeline Composer.

This module is used by BOTH execution engines:
- the local dev server (pipeline-composer/server/run_server.py) imports it;
- the in-browser Pyodide engine loads this exact file via a Vite ?raw import
  and calls run_spec_json().

It therefore must stay dependency-free (spaCy only), work on spaCy 3.7.x and
3.8.x, and return plain JSON-serializable data.
"""

import json
import re

import spacy
from spacy import displacy

try:  # spaCy 3.8.x registers built-in factories lazily
    from spacy.pipeline.factories import register_factories

    register_factories()
except ImportError:  # pragma: no cover - spaCy 3.7.x registers at import
    pass

MAX_TEXT_LENGTH = 10_000

# spaCy website primary font stack (website/src/styles/layout.sass --font-primary)
# so displaCy renders in the same font as the docs instead of displaCy's Arial default.
DISPLACY_FONT = (
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, "
    "sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
)

_PIPELINE_CACHE = {}
_PIPELINE_CACHE_ORDER = []
_PIPELINE_CACHE_SIZE = 4


class SpecError(ValueError):
    """Raised when a pipeline spec cannot be built."""


def _cache_key(spec):
    return json.dumps(spec, sort_keys=True)


def build_pipeline(spec, warnings):
    """Build an nlp object from a PipelineSpec dict, collecting warnings."""
    base = spec.get("base") or {"type": "blank"}
    lang = spec.get("lang") or "en"
    if base.get("type") == "model":
        model = base.get("name") or "en_core_web_sm"
        try:
            nlp = spacy.load(model)
        except OSError as err:
            raise SpecError(
                f"Trained model '{model}' is not installed on the run server "
                f"(pip install {model} or python -m spacy download {model})."
            ) from err
    else:
        try:
            nlp = spacy.blank(lang)
        except (ImportError, OSError) as err:
            raise SpecError(
                f"Language '{lang}' needs extra dependencies not available "
                f"in this engine: {err}"
            ) from err

    has_trainable = False
    for comp in spec.get("components", []):
        factory = comp.get("factory")
        name = comp.get("name") or factory
        config = comp.get("config") or {}
        if factory not in nlp.factory_names:
            warnings.append(
                f"Component '{factory}' is not available in spaCy "
                f"{spacy.__version__}; skipped."
            )
            continue
        try:
            pipe = nlp.add_pipe(factory, name=name, config=config)
        except Exception as err:
            warnings.append(f"Could not add '{name}': {err}")
            continue
        patterns = comp.get("patterns") or []
        if patterns:
            if hasattr(pipe, "add_patterns"):
                try:
                    pipe.add_patterns(patterns)
                except Exception as err:
                    warnings.append(f"Invalid patterns for '{name}': {err}")
            else:
                warnings.append(f"'{name}' does not accept patterns; ignored.")
        if factory in {
            "tok2vec",
            "tagger",
            "morphologizer",
            "parser",
            "ner",
            "senter",
            "trainable_lemmatizer",
            "textcat",
            "textcat_multilabel",
            "spancat",
        }:
            has_trainable = True

    if has_trainable and base.get("type") != "model":
        try:
            nlp.initialize()
        except Exception:
            pass
        warnings.append(
            "This pipeline contains untrained trainable component(s); their "
            "predictions will be meaningless until trained."
        )
    return nlp


def get_pipeline(spec, warnings):
    key = _cache_key(spec)
    if key in _PIPELINE_CACHE:
        nlp, cached_warnings = _PIPELINE_CACHE[key]
        warnings.extend(cached_warnings)
        return nlp
    build_warnings = []
    nlp = build_pipeline(spec, build_warnings)
    warnings.extend(build_warnings)
    _PIPELINE_CACHE[key] = (nlp, build_warnings)
    _PIPELINE_CACHE_ORDER.append(key)
    while len(_PIPELINE_CACHE_ORDER) > _PIPELINE_CACHE_SIZE:
        evicted = _PIPELINE_CACHE_ORDER.pop(0)
        _PIPELINE_CACHE.pop(evicted, None)
    return nlp


def _token_rows(doc):
    rows = []
    for token in doc:
        rows.append(
            {
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
                "dep": token.dep_,
                "head": token.head.i,
                "ent_type": token.ent_type_,
                "ent_iob": token.ent_iob_,
                "is_sent_start": bool(token.is_sent_start),
                "morph": str(token.morph),
            }
        )
    return rows


def _spans_payload(doc):
    spans = {}
    for key, group in doc.spans.items():
        spans[key] = [
            {
                "start": s.start_char,
                "end": s.end_char,
                "label": s.label_,
                "text": s.text,
            }
            for s in group
        ]
    return spans


def _displacy_payload(doc, warnings):
    payload = {}
    try:
        if doc.ents:
            # Entity font is inherited from the container (see ResultsView iframe).
            payload["ent"] = displacy.render(doc, style="ent", page=False)
    except Exception as err:  # pragma: no cover - defensive
        warnings.append(f"displaCy ent rendering failed: {err}")
    try:
        if doc.has_annotation("DEP") and doc.has_annotation("SENT_START"):
            payload["dep"] = displacy.render(
                doc,
                style="dep",
                page=False,
                options={"compact": True, "font": DISPLACY_FONT},
            )
    except Exception as err:  # pragma: no cover - defensive
        warnings.append(f"displaCy dep rendering failed: {err}")
    return payload


def _run_doc(nlp, text, warnings):
    """Run text through the pipeline, disabling components that fail because
    they are untrained (spaCy error E109) instead of failing the whole run."""
    disabled = []
    for _ in range(len(nlp.pipe_names) + 1):
        try:
            with nlp.select_pipes(disable=disabled):
                return nlp(text)
        except Exception as err:
            message = str(err)
            match = re.search(r"\[E109\] Component '([^']+)'", message)
            if match and match.group(1) in nlp.pipe_names:
                name = match.group(1)
                if name not in disabled:
                    disabled.append(name)
                    warnings.append(f"'{name}' skipped for this run: untrained.")
                    continue
            raise SpecError(f"Pipeline failed on the sample text: {err}") from err
    raise SpecError("Pipeline failed: all components were skipped.")


def run_spec(spec, text, engine="local"):
    """Run `text` through the pipeline described by `spec` (a dict).

    Returns a JSON-serializable dict matching the RunResult type in
    src/runtime/types.ts.
    """
    if not isinstance(spec, dict):
        raise SpecError("spec must be an object")
    text = (text or "").strip()
    if not text:
        raise SpecError("No sample text given.")
    if len(text) > MAX_TEXT_LENGTH:
        raise SpecError(f"Text too long (max {MAX_TEXT_LENGTH} characters).")

    warnings = []
    nlp = get_pipeline(spec, warnings)
    doc = _run_doc(nlp, text, warnings)

    sents = []
    try:
        if doc.has_annotation("SENT_START"):
            sents = [s.text for s in doc.sents]
    except Exception:
        sents = []

    return {
        "tokens": _token_rows(doc),
        "ents": [
            {
                "start": e.start_char,
                "end": e.end_char,
                "label": e.label_,
                "text": e.text,
            }
            for e in doc.ents
        ],
        "sents": sents,
        "cats": {k: float(v) for k, v in doc.cats.items()},
        "spans": _spans_payload(doc),
        "displacy": _displacy_payload(doc, warnings),
        "warnings": warnings,
        "meta": {
            "engine": engine,
            "spacy_version": spacy.__version__,
            "pipeline": list(nlp.pipe_names),
        },
    }


def run_spec_json(spec_json, text):
    """JSON-string wrapper used by the Pyodide engine."""
    try:
        spec = json.loads(spec_json)
        result = run_spec(spec, text, engine="pyodide")
    except SpecError as err:
        return json.dumps({"error": str(err)})
    except Exception as err:  # pragma: no cover - defensive
        return json.dumps({"error": f"Unexpected error: {err}"})
    return json.dumps(result)
