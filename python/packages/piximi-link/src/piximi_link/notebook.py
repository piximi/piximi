"""Serving from inside a notebook kernel.

Jupyter and marimo both run cells on an asyncio loop, so the server can
share it: ``session = await serve(engine)`` starts it there and returns a
handle that renders as the app in the notebook output and knows the URL to
open in a tab. Calls into the engine from later cells run on the same loop,
so their events reach the connected tabs.
"""

from __future__ import annotations

import html
import os
from pathlib import Path

from .auth import Auth
from .engine import Engine
from .server import Served
from .server import serve as serve_app
from .session import SessionHub


class NotebookSession:
    def __init__(self, hub: SessionHub, served: Served, auth: Auth, host: str, static_dir: Path | None):
        self.hub = hub
        self._served = served
        self.auth = auth
        self.host = host
        self.static_dir = static_dir

    @property
    def port(self) -> int:
        return self._served.port

    @property
    def ws_url(self) -> str:
        return f"ws://{self.host}:{self.port}/ws"

    @property
    def url(self) -> str:
        """The URL to open in a browser tab, launch token included. Under
        JupyterHub the kernel's host is not reachable from the browser, so
        it is the path through jupyter-server-proxy, relative to the hub,
        which is how the notebook page resolves it."""
        query = f"?token={self.auth.token}" if self.auth.token else ""
        if self.static_dir is None:
            # No bundle to serve: point a frontend elsewhere at the backend.
            extra = f"&token={self.auth.token}" if self.auth.token else ""
            return f"http://localhost:3000/?backend={self.ws_url}{extra}"
        hub_prefix = os.environ.get("JUPYTERHUB_SERVICE_PREFIX")
        if hub_prefix:
            return f"{hub_prefix.rstrip('/')}/proxy/{self.port}/{query}"
        return f"http://{self.host}:{self.port}/{query}"

    async def stop(self) -> None:
        await self.hub.close()
        await self._served.stop()

    def _repr_html_(self) -> str:
        """The app, inline, as both Jupyter and marimo render it."""
        if self.static_dir is None:
            return f'<a href="{html.escape(self.url)}" target="_blank">{html.escape(self.url)}</a>'
        return (
            f'<iframe src="{html.escape(self.url)}" style="width:100%;height:720px;border:0"></iframe>'
            f'<div><a href="{html.escape(self.url)}" target="_blank">open in a tab</a></div>'
        )


async def serve(
    engine: Engine,
    *,
    host: str = "127.0.0.1",
    port: int = 0,
    token: str | None = None,
    auth: bool = True,
    static_dir: Path | None = None,
    allowed_origins: set[str] | None = None,
) -> NotebookSession:
    """Starts serving ``engine`` on the running loop and returns a handle.
    Shares the loop the kernel runs cells on, so call it as
    ``session = await serve(engine)``."""
    session_auth = Auth((token or Auth.generate_token()) if auth else None)
    hub = SessionHub(engine, auth=session_auth)
    served = await serve_app(
        hub,
        host=host,
        port=port,
        auth=session_auth,
        static_dir=static_dir,
        allowed_origins=allowed_origins,
    )
    return NotebookSession(hub, served, session_auth, host, static_dir)
