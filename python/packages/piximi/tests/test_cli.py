"""The `piximi` command and the frontend build it serves."""

import importlib.util
import json
from pathlib import Path

import pytest

from piximi_app import cli
from piximi_app.bundle import find_frontend, frontend_version_warning
from piximi_schema import PROTOCOL_VERSION


def test_serving_without_the_engine_says_which_extra_to_install(monkeypatch, capsys):
    real = importlib.util.find_spec
    monkeypatch.setattr(
        importlib.util, "find_spec", lambda name, *a: None if name == "piximi_engine" else real(name, *a)
    )
    with pytest.raises(SystemExit) as exit:
        cli.main(["serve", "--port", "0"])
    assert exit.value.code == 2
    assert "piximi[engine]" in capsys.readouterr().err


def test_frontend_is_found_and_its_stamp_checked(tmp_path: Path, monkeypatch):
    monkeypatch.delenv("PIXIMI_FRONTEND_DIR", raising=False)
    (tmp_path / "index.html").write_text("<html></html>")
    assert find_frontend(str(tmp_path)) == tmp_path.resolve()
    assert "no protocol stamp" in frontend_version_warning(tmp_path)

    stamp = tmp_path / "piximi-frontend.json"
    stamp.write_text(json.dumps({"protocolVersion": PROTOCOL_VERSION}))
    assert frontend_version_warning(tmp_path) is None
    stamp.write_text(json.dumps({"protocolVersion": "0.0.1"}))
    assert "speaks protocol 0.0.1" in frontend_version_warning(tmp_path)


def test_connect_refuses_what_only_a_local_engine_uses(tmp_path: Path):
    with pytest.raises(SystemExit) as exit:
        cli.main(["serve", str(tmp_path), "--connect", "ws://elsewhere/ws", "--no-gpu"])
    assert "drop a folder of images, --no-gpu" in str(exit.value.code)


def test_connect_wants_an_engine_url():
    with pytest.raises(SystemExit) as exit:
        cli.main(["serve", "--connect", "elsewhere:8000"])
    assert "ws:// or wss:// URL" in str(exit.value.code)
