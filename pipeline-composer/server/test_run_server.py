"""Tests for the local run server's request validation. Run with: pytest pipeline-composer/server"""

import http.client
import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

from run_server import ComposerHandler  # noqa: E402


@pytest.fixture()
def server():
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), ComposerHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield httpd.server_address
    finally:
        httpd.shutdown()
        thread.join()
        httpd.server_close()


def _post(address, body_obj):
    conn = http.client.HTTPConnection(*address)
    try:
        body = json.dumps(body_obj).encode("utf-8")
        conn.request("POST", "/api/run", body=body, headers={"Content-Type": "application/json"})
        resp = conn.getresponse()
        return resp.status, json.loads(resp.read())
    finally:
        conn.close()


def test_non_dict_base_returns_clean_400(server):
    status, payload = _post(server, {"spec": {"lang": "en", "base": "blank", "components": []}})
    assert status == 400
    assert "spec.base" in payload["error"]


def test_non_dict_spec_returns_clean_400(server):
    status, payload = _post(server, {"spec": "not-a-spec"})
    assert status == 400
    assert "spec" in payload["error"]


def test_valid_blank_spec_still_runs(server):
    status, payload = _post(
        server,
        {
            "spec": {
                "lang": "en",
                "base": {"type": "blank"},
                "components": [{"factory": "sentencizer", "name": "sentencizer", "config": {}}],
            },
            "text": "Hello world.",
        },
    )
    assert status == 200
    assert payload["meta"]["pipeline"] == ["sentencizer"]
