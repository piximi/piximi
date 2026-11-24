"""A relay that forwards frames between a client and an upstream peer
without decoding them, as `piximi_link.gateway` does past the first
message. Anything that works through it only needs the frames."""

from __future__ import annotations

import asyncio

from websockets.asyncio.server import Server

from ..gateway import pump
from ..transports.websocket import WebSocketTransport, connect, serve


async def serve_relay(upstream_uri: str, host: str = "127.0.0.1", port: int = 0) -> Server:
    async def on_connection(client: WebSocketTransport) -> None:
        upstream = await connect(upstream_uri)
        await asyncio.gather(pump(client, upstream), pump(upstream, client))

    return await serve(on_connection, host, port)
