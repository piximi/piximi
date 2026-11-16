"""A WebSocket peer with handlers that exercise every protocol feature, for
the cross-language tests. Run as ``piximi-link-echo``; it prints ``PORT <n>``
once listening.

Methods: ``echo``, ``bytes``, ``progress``, ``slow`` (cancels with an error),
``slow-partial`` (cancels with a partial result), ``fail`` (a BackendError),
``initialize`` (version check), and after the ``initialized`` notification it
calls ``ping-back`` on the client.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from typing import Any

from piximi_schema import PROTOCOL_VERSION

from ..errors import BackendError, RequestCancelled
from ..peer import HandlerContext, Peer
from ..transports.websocket import WebSocketTransport, bound_port, serve


def register_handlers(peer: Peer) -> None:
    async def echo(params: Any, _ctx: HandlerContext) -> Any:
        return params

    async def bytes_(params: Any, _ctx: HandlerContext) -> Any:
        data: bytes = params["data"]
        return {"length": len(data), "last": data[-1] if data else None, "data": data}

    async def progress(params: Any, ctx: HandlerContext) -> Any:
        for percent in params.get("steps", [10, 50, 100]):
            ctx.progress({"percent": percent, "message": f"{percent}%"})
            await asyncio.sleep(0)
        return "done"

    async def slow(_params: Any, ctx: HandlerContext) -> Any:
        await ctx.wait_cancelled()
        raise RequestCancelled()

    async def slow_partial(_params: Any, ctx: HandlerContext) -> Any:
        await ctx.wait_cancelled()
        return {"cancelled": True, "added": 2}

    async def fail(_params: Any, _ctx: HandlerContext) -> Any:
        raise BackendError("MODEL_NOT_FOUND", 'No model "x"')

    async def initialize(params: Any, _ctx: HandlerContext) -> Any:
        wanted = str(params.get("protocolVersion", ""))
        if wanted.split(".")[0] != PROTOCOL_VERSION.split(".")[0]:
            raise BackendError(
                "NOT_SUPPORTED",
                f"Protocol {wanted} is not supported; this server speaks {PROTOCOL_VERSION}",
            )
        return {
            "protocolVersion": PROTOCOL_VERSION,
            "serverCapabilities": [],
            "sessionId": "echo",
            "serverInfo": {"name": "piximi-link-echo", "version": "0"},
        }

    def initialized(_params: Any) -> None:
        async def ping_back() -> None:
            try:
                await peer.request("ping-back", {"from": "server"})
            except Exception:
                pass

        asyncio.create_task(ping_back())

    peer.on_request("echo", echo)
    peer.on_request("bytes", bytes_)
    peer.on_request("progress", progress)
    peer.on_request("slow", slow)
    peer.on_request("slow-partial", slow_partial)
    peer.on_request("fail", fail)
    peer.on_request("initialize", initialize)
    peer.on_notification("initialized", initialized)


async def run(host: str, port: int) -> None:
    async def on_connection(transport: WebSocketTransport) -> None:
        async with Peer(transport) as peer:
            register_handlers(peer)
            await peer.wait_closed()

    server = await serve(on_connection, host, port)
    print(f"PORT {bound_port(server)}", flush=True)
    await server.wait_closed()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args(argv)
    try:
        asyncio.run(run(args.host, args.port))
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
