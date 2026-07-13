"""Ties src/generated/factory-meta.json to the installed spaCy.

The vitest "catalog drift" check only guarantees the JSON and the TS catalog
agree with each other; nothing otherwise stops the JSON from being generated
against a different spaCy version than the one that actually runs pipelines.
This test regenerates the payload from the live install and diffs it, so a
version/default drift fails loudly instead of silently shipping wrong defaults.

Run with: pytest pipeline-composer/server
"""

import json
import sys
from pathlib import Path

import spacy

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from generate_component_meta import OUT_PATH, build_payload  # noqa: E402


def _committed():
    return json.loads(OUT_PATH.read_text())


def test_factory_meta_matches_installed_spacy():
    committed = _committed()
    live = build_payload()
    assert committed["spacyVersion"] == spacy.__version__, (
        f"factory-meta.json was generated from spaCy {committed['spacyVersion']} "
        f"but {spacy.__version__} is installed; rerun "
        "scripts/generate_component_meta.py."
    )
    assert committed == live, (
        "factory-meta.json is stale vs the installed spaCy's live FactoryMeta "
        "dump; rerun scripts/generate_component_meta.py."
    )
