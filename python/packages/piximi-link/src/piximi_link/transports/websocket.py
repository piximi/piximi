"""WebSocket transport on the ``websockets`` library, as client or server."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from websockets.asyncio.client import connect as ws_connect
from websockets.asyncio.connection import Connection
from websockets.asyncio.server import Server, ServerConnection
from websockets.asyncio.server import serve as ws_serve
from websockets.exceptions import ConnectionClosed

from ..transport import TransportClosed

MAX_FRAME_BYTES = 1024 * 1024
"""Browsers and ``websockets`` both take 1 MiB messages comfortably."""

# A little above the frame size, so a compliant peer never trips it.
_MAX_MESSAGE_SIZE = 2 * MAX_FRAME_BYTES


class WebSocketTransport:
    def __init__(self, connection: Connection) -> None:
        self.max_frame_bytes = MAX_FRAME_BYTES
        self._connection = connection

    async def send(self, frame: bytes) -> None:
        try:
            await self._connection.send(frame)
        except ConnectionClosed as error:
            raise TransportClosed() from error

    async def recv(self) -> bytes:
        try:
            message = await self._connection.recv()
        except ConnectionClosed as error:
            raise TransportClosed() from error
        if isinstance(message, str):
            raise TransportClosed("Text frames are not part of the protocol")
        return message

    async def close(self) -> None:
        await self._connection.close()


async def connect(uri: str) -> WebSocketTransport:
    connection = await ws_connect(uri, max_size=_MAX_MESSAGE_SIZE)
    return WebSocketTransport(connection)


async def serve(
    on_connection: Callable[[WebSocketTransport], Awaitable[None]],
    host: str = "127.0.0.1",
    port: int = 0,
) -> Server:
    """Starts a server that hands each connection to ``on_connection`` as a
    transport; the coroutine returning closes the connection. Use ``port=0``
    for an ephemeral port and read it from ``server.sockets``."""

    async def handler(connection: ServerConnection) -> None:
        await on_connection(WebSocketTransport(connection))

    return await ws_serve(handler, host, port, max_size=_MAX_MESSAGE_SIZE)


def bound_port(server: Server) -> int:
    return server.sockets[0].getsockname()[1]
