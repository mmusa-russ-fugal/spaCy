"""Tests for the shared pipeline runner. Run with: pytest pipeline-composer/server"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "runner"))

from spacy_runner import SpecError, run_spec, run_spec_json  # noqa: E402

RULER_SPEC = {
    "lang": "en",
    "base": {"type": "blank"},
    "components": [
        {"factory": "sentencizer", "name": "sentencizer", "config": {}},
        {
            "factory": "entity_ruler",
            "name": "entity_ruler",
            "config": {"phrase_matcher_attr": "LOWER"},
            "patterns": [
                {"label": "ORG", "pattern": "Apple"},
                {"label": "GPE", "pattern": [{"LOWER": "u.k."}]},
            ],
        },
        {"factory": "merge_entities", "name": "merge_entities", "config": {}},
    ],
}

TEXT = "Apple is looking at buying U.K. startup for $1 billion."


def test_ruler_pipeline_finds_entities():
    result = run_spec(RULER_SPEC, TEXT)
    labels = {e["label"] for e in result["ents"]}
    assert "ORG" in labels
    assert "GPE" in labels
    assert result["meta"]["pipeline"] == ["sentencizer", "entity_ruler", "merge_entities"]
    assert result["sents"], "sentencizer should produce sentences"
    assert "ent" in result["displacy"]
    assert result["warnings"] == []
    # merge_entities merged "U.K." into one token
    assert any(t["text"] == "U.K." and t["ent_type"] == "GPE" for t in result["tokens"])
    json.dumps(result)  # payload must be JSON-serializable


def test_untrained_trainable_warns_but_runs():
    spec = {
        "lang": "en",
        "base": {"type": "blank"},
        "components": [
            {"factory": "tok2vec", "name": "tok2vec", "config": {}},
            {"factory": "tagger", "name": "tagger", "config": {}},
        ],
    }
    result = run_spec(spec, "This is a test.")
    assert any("untrained" in w for w in result["warnings"])
    assert len(result["tokens"]) == 5


def test_unknown_component_is_skipped_with_warning():
    spec = {
        "lang": "en",
        "base": {"type": "blank"},
        "components": [
            {"factory": "sentencizer", "name": "sentencizer", "config": {}},
            {"factory": "does_not_exist", "name": "nope", "config": {}},
        ],
    }
    result = run_spec(spec, "Hello there. General Kenobi.")
    assert result["meta"]["pipeline"] == ["sentencizer"]
    assert any("not available" in w for w in result["warnings"])
    assert len(result["sents"]) == 2


def test_text_limits():
    with pytest.raises(SpecError):
        run_spec(RULER_SPEC, "")
    with pytest.raises(SpecError):
        run_spec(RULER_SPEC, "x" * 20_000)


def test_missing_model_gives_clear_error():
    spec = {
        "lang": "en",
        "base": {"type": "model", "name": "xx_definitely_not_installed"},
        "components": [],
    }
    with pytest.raises(SpecError, match="not installed"):
        run_spec(spec, TEXT)


def test_run_spec_json_roundtrip():
    payload = run_spec_json(json.dumps(RULER_SPEC), TEXT)
    result = json.loads(payload)
    assert "error" not in result
    assert result["meta"]["engine"] == "pyodide"


def test_run_spec_json_error_shape():
    payload = run_spec_json(json.dumps(RULER_SPEC), "")
    assert json.loads(payload)["error"]
