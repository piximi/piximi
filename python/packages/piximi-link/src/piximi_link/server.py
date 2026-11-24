"""The HTTP/WebSocket server.

- ``/ws`` speaks the protocol to the session hub, or, on a gateway, forwards
  each session to the engine upstream (see ``gateway``).
- ``POST /session`` exchanges the launch token for a ticket (see ``auth``).
- With a frontend bundle configured, everything else serves it as a
  single-page app, with the backend's location injected into ``index.html``
  so the page connects to the server that served it.

Behind a path-prefixing proxy (jupyter-server-proxy, a ``Mount`` in a larger
ASGI app) the page needs its public prefix for the WebSocket URL and the
router; it comes from ``base_path`` when given, else per request from the
``X-Forwarded-Prefix`` header such proxies send. The bundle's own asset
URLs are relative, so they need nothing.
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from urllib.parse import urlsplit

import uvicorn
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import FileResponse, HTMLResponse, JSONResponse, Response
from starlette.routing import Route, WebSocketRoute
from starlette.websockets import WebSocket

from .auth import Auth
from .gateway import Upstream, forward
from .peer import Peer
from .session import SessionHub
from .transports.asgi import AsgiWebSocketTransport

log = logging.getLogger(__name__)

CONFIG_GLOBAL = "__PIXIMI_BACKEND__"

LOCAL_HOSTS = {"localhost", "127.0.0.1", "[::1]"}
# The same loopback rule as `origin_allowed`, for the CORS preflight.
LOOPBACK_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1|\[::1\]|[^/]+\.localhost)(:\d+)?$"


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


def normalize_prefix(prefix: str | None) -> str:
    """``/a/b/`` → ``/a/b``; the root (or nothing) → ``""``."""
    if not prefix:
        return ""
    prefix = "/" + prefix.strip("/")
    return "" if prefix == "/" else prefix


def page_config(prefix: str) -> dict:
    """What the served page needs to reach this backend from ``prefix``."""
    config: dict = {"url": f"{prefix}/ws"}
    if prefix:
        config["basePath"] = prefix
    return config


def inject_config(index_html: str, config: dict) -> str:
    script = f"<script>window.{CONFIG_GLOBAL} = {json.dumps(config)};</script>"
    marker = "</head>"
    if marker in index_html:
        return index_html.replace(marker, f"{script}\n{marker}", 1)
    return script + index_html


def create_app(
    hub: SessionHub | None,
    *,
    auth: Auth | None = None,
    static_dir: Path | None = None,
    allowed_origins: set[str] | None = None,
    base_path: str | None = None,
    upstream: Upstream | None = None,
) -> Starlette:
    """The app that serves ``hub``, or, given an ``upstream`` instead, a
    gateway that forwards each session there (see ``gateway``)."""
    if (hub is None) == (upstream is None):
        raise ValueError("Serve either a hub or an upstream")
    auth = auth or Auth(None)
    allowed = allowed_origins or set()
    fixed_prefix = normalize_prefix(base_path) if base_path is not None else None

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
        # A gateway's sessions get their id from the engine, in `initialize`.
        return JSONResponse({"ticket": ticket, "sessionId": hub.session_id if hub else None})

    async def ws_endpoint(websocket: WebSocket) -> None:
        if not origin_allowed(
            websocket.headers.get("origin"), websocket.headers.get("host"), allowed
        ):
            await websocket.close(code=4403, reason="origin not allowed")
            return
        await websocket.accept()
        if upstream is not None:
            await forward(AsgiWebSocketTransport(websocket), upstream, auth)
            return
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
        index_html = (root / "index.html").read_text()

        async def static_endpoint(request: Request) -> Response:
            path = request.path_params.get("path", "")
            if path and path != "index.html":
                candidate = (root / path).resolve()
                if candidate.is_file() and root in candidate.parents:
                    return FileResponse(candidate)
            # Everything else is the app, including its client-side routes.
            prefix = (
                fixed_prefix
                if fixed_prefix is not None
                else normalize_prefix(request.headers.get("x-forwarded-prefix"))
            )
            return HTMLResponse(inject_config(index_html, page_config(prefix)))

        routes.append(Route("/", static_endpoint))
        routes.append(Route("/{path:path}", static_endpoint))

    # A page on another origin (the Vite dev server, the public site) trades
    # its token over a cross-origin POST, which the browser preflights.
    cors = Middleware(
        CORSMiddleware,
        allow_origins=sorted(allowed),
        allow_origin_regex=LOOPBACK_ORIGIN_REGEX,
        allow_methods=["POST"],
        allow_headers=["content-type"],
    )
    return Starlette(routes=routes, middleware=[cors])


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
    hub: SessionHub | None,
    host: str = "127.0.0.1",
    port: int = 0,
    *,
    auth: Auth | None = None,
    static_dir: Path | None = None,
    allowed_origins: set[str] | None = None,
    base_path: str | None = None,
    upstream: Upstream | None = None,
) -> Served:
    """Starts serving on the running loop and returns once the port is bound,
    so a caller can print it or connect to it. ``port=0`` picks a free one."""
    app = create_app(
        hub,
        auth=auth,
        static_dir=static_dir,
        allowed_origins=allowed_origins,
        base_path=base_path,
        upstream=upstream,
    )
    config = uvicorn.Config(app, host=host, port=port, log_level="warning", ws="websockets")
    server = uvicorn.Server(config)
    task = asyncio.create_task(server.serve(), name="piximi-link-server")
    while not server.started:
        if task.done():
            task.result()
            raise RuntimeError("Server stopped before starting")
        await asyncio.sleep(0.01)
    return Served(server, task)
