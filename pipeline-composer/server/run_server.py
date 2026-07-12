"""Optional local run server for the spaCy Pipeline Composer.

Stdlib-only (no FastAPI/Flask): serves two JSON endpoints the composer UI
auto-detects. Start it with:

    python pipeline-composer/server/run_server.py [--port 8765]

Endpoints:
    GET  /api/health -> {"status": "ok", "spacy_version": ..., "models": [...]}
    POST /api/run    -> body {"spec": PipelineSpec, "text": str} -> RunResult

The composer works without this server (static exports + the in-browser
Pyodide engine); running it enables live execution against the locally
installed spaCy, including trained models.
"""

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "runner"))

import spacy  # noqa: E402
import spacy.util  # noqa: E402
from spacy_runner import MAX_TEXT_LENGTH, SpecError, run_spec  # noqa: E402

MAX_BODY_BYTES = 256 * 1024


class ComposerHandler(BaseHTTPRequestHandler):
    server_version = "SpacyComposer/1.0"

    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):  # noqa: N802 - http.server naming
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):  # noqa: N802
        if self.path.rstrip("/") == "/api/health":
            try:
                models = sorted(spacy.util.get_installed_models())
            except Exception:
                models = []
            self._send_json(
                {
                    "status": "ok",
                    "engine": "local",
                    "spacy_version": spacy.__version__,
                    "models": models,
                }
            )
        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_POST(self):  # noqa: N802
        if self.path.rstrip("/") != "/api/run":
            self._send_json({"error": "Not found"}, status=404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY_BYTES:
            self._send_json({"error": "Request body missing or too large."}, status=400)
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            spec = payload["spec"]
            text = payload.get("text", "")
        except (json.JSONDecodeError, KeyError, UnicodeDecodeError):
            self._send_json({"error": "Invalid JSON request body."}, status=400)
            return
        try:
            result = run_spec(spec, text, engine="local")
        except SpecError as err:
            self._send_json({"error": str(err)}, status=400)
            return
        except Exception as err:  # pragma: no cover - defensive
            self._send_json({"error": f"Unexpected server error: {err}"}, status=500)
            return
        self._send_json(result)

    def log_message(self, fmt, *args):  # keep the console quiet
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), ComposerHandler)
    print(
        f"spaCy Pipeline Composer run server on http://127.0.0.1:{args.port} "
        f"(spaCy {spacy.__version__}, text limit {MAX_TEXT_LENGTH} chars). "
        "Ctrl+C to stop."
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
