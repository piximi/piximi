"""A relay that forwards frames between a client and an upstream peer
without decoding them: the shape a local gateway in front of a remote
engine will take. Anything that works through it only needs the frames."""

from __future__ import annotations

import asyncio

from websockets.asyncio.server import Server

from ..transport import TransportClosed
from ..transports.websocket import WebSocketTransport, connect, serve


async def _pump(source: WebSocketTransport, sink: WebSocketTransport) -> None:
    try:
        while True:
            await sink.send(await source.recv())
    except TransportClosed:
        pass
    finally:
        await sink.close()


async def serve_relay(upstream_uri: str, host: str = "127.0.0.1", port: int = 0) -> Server:
    async def on_connection(client: WebSocketTransport) -> None:
        upstream = await connect(upstream_uri)
        await asyncio.gather(_pump(client, upstream), _pump(upstream, client))

    return await serve(on_connection, host, port)
