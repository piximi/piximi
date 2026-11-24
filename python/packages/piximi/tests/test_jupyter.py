"""The launcher entry point jupyter-server-proxy discovers."""

import sys
from importlib.metadata import entry_points

from piximi_app.jupyter import setup_piximi


def test_launcher_entry_point_is_registered():
    found = [ep for ep in entry_points(group="jupyter_serverproxy_servers") if ep.name == "piximi"]
    assert found and found[0].load() is setup_piximi


def test_command_takes_the_proxied_port_and_optional_folder(monkeypatch):
    monkeypatch.delenv("PIXIMI_IMAGES", raising=False)
    monkeypatch.delenv("PIXIMI_DATA_DIR", raising=False)
    config = setup_piximi()
    # The server's own interpreter, so no `piximi` executable has to be on PATH.
    assert config["command"] == [sys.executable, "-m", "piximi_app.cli", "serve", "--port", "{port}", "--no-auth"]
    assert config["launcher_entry"]["title"] == "Piximi"

    monkeypatch.setenv("PIXIMI_IMAGES", "/data/images")
    monkeypatch.setenv("PIXIMI_DATA_DIR", "/data/project")
    command = setup_piximi()["command"]
    assert command[4] == "/data/images" and command[-2:] == ["--data-dir", "/data/project"]
