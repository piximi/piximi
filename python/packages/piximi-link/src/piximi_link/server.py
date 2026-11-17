"""The HTTP/WebSocket server: ``/ws`` speaks the protocol to the hub, and
later the same app serves the frontend bundle and the session endpoint."""

from __future__ import annotations

import asyncio
import logging

import uvicorn
from starlette.applications import Starlette
from starlette.routing import WebSocketRoute
from starlette.websockets import WebSocket

from .peer import Peer
from .session import SessionHub
from .transports.asgi import AsgiWebSocketTransport

log = logging.getLogger(__name__)


def create_app(hub: SessionHub) -> Starlette:
    async def ws_endpoint(websocket: WebSocket) -> None:
        await websocket.accept()
        peer = Peer(AsgiWebSocketTransport(websocket))
        async with peer:
            hub.attach(peer)
            try:
                await peer.wait_closed()
            finally:
                hub.detach(peer)

    return Starlette(routes=[WebSocketRoute("/ws", ws_endpoint)])


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


async def serve(hub: SessionHub, host: str = "127.0.0.1", port: int = 0) -> Served:
    """Starts serving on the running loop and returns once the port is bound,
    so a caller can print it or connect to it. ``port=0`` picks a free one."""
    config = uvicorn.Config(create_app(hub), host=host, port=port, log_level="warning", ws="websockets")
    server = uvicorn.Server(config)
    task = asyncio.create_task(server.serve(), name="piximi-link-server")
    while not server.started:
        if task.done():
            task.result()
            raise RuntimeError("Server stopped before starting")
        await asyncio.sleep(0.01)
    return Served(server, task)
