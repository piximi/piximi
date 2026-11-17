"""The HTTP/WebSocket server.

- ``/ws`` speaks the protocol to the session hub.
- ``POST /session`` exchanges the launch token for a ticket (see ``auth``).
- With a frontend bundle configured, everything else serves it as a
  single-page app, with the backend's location injected into ``index.html``
  so the page connects to the server that served it.
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from urllib.parse import urlsplit

import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import FileResponse, HTMLResponse, JSONResponse, Response
from starlette.routing import Route, WebSocketRoute
from starlette.websockets import WebSocket

from .auth import Auth
from .peer import Peer
from .session import SessionHub
from .transports.asgi import AsgiWebSocketTransport

log = logging.getLogger(__name__)

CONFIG_GLOBAL = "__PIXIMI_BACKEND__"

LOCAL_HOSTS = {"localhost", "127.0.0.1", "[::1]"}


def origin_allowed(origin: str | None, host: str | None, allowed: set[str]) -> bool:
    """Same-origin pages, anything on a loopback host (the dev server), and
    explicitly allowed origins may open a session."""
    if origin is None:
        return True  # not a browser
    parts = urlsplit(origin)
    if parts.hostname in LOCAL_HOSTS or (parts.hostname or "").endswith(".localhost"):
        return True
    if host is not None and parts.netloc == host:
        return True
    return origin in allowed


def inject_config(index_html: str, config: dict) -> str:
    script = f"<script>window.{CONFIG_GLOBAL} = {json.dumps(config)};</script>"
    marker = "</head>"
    if marker in index_html:
        return index_html.replace(marker, f"{script}\n{marker}", 1)
    return script + index_html


def create_app(
    hub: SessionHub,
    *,
    auth: Auth | None = None,
    static_dir: Path | None = None,
    allowed_origins: set[str] | None = None,
) -> Starlette:
    auth = auth or Auth(None)
    allowed = allowed_origins or set()

    async def session_endpoint(request: Request) -> Response:
        if not origin_allowed(request.headers.get("origin"), request.headers.get("host"), allowed):
            return JSONResponse({"error": "origin not allowed"}, status_code=403)
        try:
            body = await request.json()
        except Exception:
            body = {}
        ticket = auth.issue_ticket(body.get("token") if isinstance(body, dict) else None)
        if ticket is None:
            return JSONResponse({"error": "invalid token"}, status_code=403)
        return JSONResponse({"ticket": ticket, "sessionId": hub.session_id})

    async def ws_endpoint(websocket: WebSocket) -> None:
        if not origin_allowed(
            websocket.headers.get("origin"), websocket.headers.get("host"), allowed
        ):
            await websocket.close(code=4403, reason="origin not allowed")
            return
        await websocket.accept()
        peer = Peer(AsgiWebSocketTransport(websocket))
        async with peer:
            hub.attach(peer)
            try:
                await peer.wait_closed()
            finally:
                hub.detach(peer)

    routes = [
        Route("/session", session_endpoint, methods=["POST"]),
        WebSocketRoute("/ws", ws_endpoint),
    ]

    if static_dir is not None:
        root = static_dir.resolve()
        index = inject_config((root / "index.html").read_text(), {"url": "/ws"})

        async def static_endpoint(request: Request) -> Response:
            path = request.path_params.get("path", "")
            if path and path != "index.html":
                candidate = (root / path).resolve()
                if candidate.is_file() and root in candidate.parents:
                    return FileResponse(candidate)
            # Everything else is the app, including its client-side routes.
            return HTMLResponse(index)

        routes.append(Route("/", static_endpoint))
        routes.append(Route("/{path:path}", static_endpoint))

    return Starlette(routes=routes)


class Served:
    """A running server: its bound port, and a way to stop it."""

    def __init__(self, server: uvicorn.Server, task: asyncio.Task[None]) -> None:
        self._server = server
        self._task = task

    @property
    def port(self) -> int:
        return self._server.servers[0].sockets[0].getsockname()[1]

    async def wait(self) -> None:
        await self._task

    async def stop(self) -> None:
        self._server.should_exit = True
        await self._task


async def serve(
    hub: SessionHub,
    host: str = "127.0.0.1",
    port: int = 0,
    *,
    auth: Auth | None = None,
    static_dir: Path | None = None,
    allowed_origins: set[str] | None = None,
) -> Served:
    """Starts serving on the running loop and returns once the port is bound,
    so a caller can print it or connect to it. ``port=0`` picks a free one."""
    app = create_app(hub, auth=auth, static_dir=static_dir, allowed_origins=allowed_origins)
    config = uvicorn.Config(app, host=host, port=port, log_level="warning", ws="websockets")
    server = uvicorn.Server(config)
    task = asyncio.create_task(server.serve(), name="piximi-link-server")
    while not server.started:
        if task.done():
            task.result()
            raise RuntimeError("Server stopped before starting")
        await asyncio.sleep(0.01)
    return Served(server, task)
