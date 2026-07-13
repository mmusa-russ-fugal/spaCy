"""Generate factory metadata for the pipeline composer's block palette.

Dumps FactoryMeta (default_config, requires, assigns, retokenizes) for the
allowlisted core built-in components to src/generated/factory-meta.json.
Only JSON-serializable scalar/list/dict config defaults are kept; registry
references like {"@scorers": ...} and model definitions are dropped because
the UI never edits them.

Usage: python scripts/generate_component_meta.py (requires spacy 3.8.x installed)
"""

import json
from pathlib import Path

import spacy

try:
    # spaCy 3.8.x registers built-in factories lazily; force registration so
    # factory_names is fully populated before we enumerate it.
    from spacy.pipeline.factories import register_factories

    register_factories()
except ImportError:
    pass

# Core built-ins exposed as blocks. Keep in sync with src/lib/catalog.ts,
# which fails its vitest drift check if an entry is missing here.
FACTORY_ALLOWLIST = [
    "tok2vec",
    "tagger",
    "morphologizer",
    "parser",
    "ner",
    "senter",
    "sentencizer",
    "lemmatizer",
    "trainable_lemmatizer",
    "attribute_ruler",
    "entity_ruler",
    "span_ruler",
    "textcat",
    "textcat_multilabel",
    "spancat",
    "merge_entities",
    "merge_noun_chunks",
    "token_splitter",
    "doc_cleaner",
]


def clean_config(value):
    """Keep only plain JSON values; drop registry refs and model blocks."""
    if isinstance(value, dict):
        if any(key.startswith("@") for key in value):
            return None
        cleaned = {}
        for key, sub in value.items():
            sub_cleaned = clean_config(sub)
            if sub_cleaned is not None or sub is None:
                cleaned[key] = sub_cleaned
        return cleaned
    if isinstance(value, (list, tuple)):
        return [clean_config(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return None


OUT_PATH = Path(__file__).parent.parent / "src" / "generated" / "factory-meta.json"


def build_payload() -> dict:
    """Dump FactoryMeta for the allowlisted factories from the installed spaCy.

    Uses a blank English pipeline's factory meta so language-specific factory
    defaults (e.g. the English lemmatizer's rule mode) match what the composer
    actually runs. Importable so tests can diff the committed JSON against the
    live spaCy install.
    """
    nlp = spacy.blank("en")
    entries = []
    missing = []
    for name in FACTORY_ALLOWLIST:
        if name not in nlp.factory_names:
            missing.append(name)
            continue
        meta = nlp.get_factory_meta(name)
        default_config = clean_config(meta.default_config or {})
        # Top-level None from clean_config means the whole config was a
        # registry ref, which cannot happen for default_config dicts.
        entries.append(
            {
                "name": name,
                "requires": sorted(meta.requires),
                "assigns": sorted(meta.assigns),
                "retokenizes": bool(meta.retokenizes),
                "defaultConfig": default_config,
            }
        )
    if missing:
        raise SystemExit(f"Factories missing from registry: {missing}")
    return {"spacyVersion": spacy.__version__, "factories": entries}


def main() -> None:
    payload = build_payload()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n")
    print(
        f"Wrote {len(payload['factories'])} factories to {OUT_PATH} "
        f"(spacy {spacy.__version__})"
    )


if __name__ == "__main__":
    main()
