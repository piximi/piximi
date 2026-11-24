"""A "Piximi" tile in the JupyterLab launcher, through jupyter-server-proxy.

Registered as a ``jupyter_serverproxy_servers`` entry point, so installing
``piximi[engine]`` next to ``jupyter-server-proxy`` is enough. The proxy
starts ``piximi serve`` on first use and forwards ``<jupyter>/piximi/`` to
it; the page learns that prefix from the proxy's ``X-Forwarded-Prefix``.

Jupyter authenticates the proxied path, so the engine itself runs without
a launch token, listening on loopback only. Point it at a folder with
``PIXIMI_IMAGES`` in the Jupyter server's environment (and optionally
``PIXIMI_DATA_DIR`` and ``PIXIMI_MODELS_DIR``); otherwise it serves an
empty project. With ``PIXIMI_CONNECT`` (an engine's URL or ticket, see
``piximi serve --connect``) the tile runs no engine and forwards to that
one instead, with ``PIXIMI_CONNECT_TOKEN`` if the engine wants a token.
"""

from __future__ import annotations

import os
import sys


def setup_piximi() -> dict:
    # The proxy runs this in the Jupyter server's interpreter, which has
    # this package; going through it rather than a `piximi` on PATH works
    # whatever environment layering (uv run --with, a kernel's venv) is in
    # play.
    command = [sys.executable, "-m", "piximi_app.cli", "serve", "--port", "{port}", "--no-auth"]
    connect = os.environ.get("PIXIMI_CONNECT")
    if connect:
        # The token, if any, is read from PIXIMI_CONNECT_TOKEN by the command.
        return _entry(command + ["--connect", connect])
    images = os.environ.get("PIXIMI_IMAGES")
    if images:
        command.insert(4, images)
    data_dir = os.environ.get("PIXIMI_DATA_DIR")
    if data_dir:
        command += ["--data-dir", data_dir]
    models_dir = os.environ.get("PIXIMI_MODELS_DIR")
    if models_dir:
        command += ["--models-dir", models_dir]
    return _entry(command)


def _entry(command: list[str]) -> dict:
    return {
        "command": command,
        "timeout": 60,
        "new_browser_tab": True,
        "launcher_entry": {"title": "Piximi"},
    }
