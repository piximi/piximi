"""Forwarding browser sessions to an engine on another machine.

A gateway serves the frontend and ``/ws`` like any server, but no engine
answers on it: each browser session becomes a channel to an *upstream*
(``Upstream.open``), and frames go across untouched in both directions.
The one message the gateway reads is the first: it must be ``initialize``,
and its ticket must redeem against the gateway's own ``Auth`` (the page
traded its launch token at this gateway's ``/session``). The gateway then
swaps in whatever the upstream wants instead, a ticket of its own or
nothing for a connection that is authenticated already, and forwards the
rest without decoding it.
"""

from __future__ import annotations

import asyncio
import json
import logging
import urllib.request
from typing import Protocol
from urllib.parse import urlsplit, urlunsplit

from piximi_schema.rpc import INVALID_REQUEST

from .auth import Auth
from .codec import CodecError, decode_message, encode_message
from .errors import BackendError, RpcRemoteError, to_rpc_error
from .framing import HEADER, FramingError, Reassembler, frame_message
from .transport import Transport, TransportClosed
from .transports.websocket import connect

log = logging.getLogger(__name__)


class Upstream(Protocol):
    """Where a gateway sends its sessions."""

    def describe(self) -> str:
        """Where it goes, for logs and the CLI."""
        ...

    async def open(self) -> tuple[Transport, str | None]:
        """A fresh channel for one session, and the ticket that session's
        ``initialize`` should carry upstream (``None`` for none)."""
        ...

    async def close(self) -> None: ...


async def pump(source: Transport, sink: Transport) -> None:
    """Forwards frames until ``source`` ends, then closes ``sink``."""
    try:
        while True:
            await sink.send(await source.recv())
    except TransportClosed:
        pass
    finally:
        await sink.close()


async def _read_first_message(client: Transport) -> tuple[int, dict]:
    """The client's first message, decoded, with its message sequence."""
    reassembler = Reassembler()
    while True:
        frame = await client.recv()
        payload = reassembler.push(frame)
        if payload is not None:
            _version, _flags, seq, _index = HEADER.unpack_from(frame)
            return seq, decode_message(payload)


async def _refuse(client: Transport, seq: int, request_id, error: Exception) -> None:
    response = {"id": request_id, "error": to_rpc_error(error)}
    try:
        for frame in frame_message(encode_message(response), seq, client.max_frame_bytes):
            await client.send(frame)
    finally:
        await client.close()


async def forward(client: Transport, upstream: Upstream, auth: Auth) -> None:
    """Serves one browser session through ``upstream`` until either side
    closes. Returns without opening anything upstream if the session does
    not start with an ``initialize`` this gateway accepts."""
    try:
        seq, message = await _read_first_message(client)
    except (TransportClosed, FramingError, CodecError):
        await client.close()
        return
    request_id = message.get("id")
    if message.get("method") != "initialize" or request_id is None:
        await _refuse(client, seq, request_id, RpcRemoteError(INVALID_REQUEST, "Call initialize first"))
        return
    params = message.get("params") or {}
    ticket = (params.get("auth") or {}).get("ticket") if isinstance(params, dict) else None
    if not auth.redeem(ticket):
        await _refuse(client, seq, request_id, BackendError("UNAUTHORIZED", "A valid session ticket is required"))
        return

    try:
        channel, upstream_ticket = await upstream.open()
    except Exception as error:
        log.warning("could not reach %s: %s", upstream.describe(), error)
        await _refuse(
            client,
            seq,
            request_id,
            BackendError("UNKNOWN", f"Could not reach the engine at {upstream.describe()}: {error}"),
        )
        return

    params = {key: value for key, value in params.items() if key != "auth"}
    if upstream_ticket is not None:
        params["auth"] = {"ticket": upstream_ticket}
    initialize = encode_message({**message, "params": params})
    try:
        for frame in frame_message(initialize, seq, channel.max_frame_bytes):
            await channel.send(frame)
    except TransportClosed:
        await client.close()
        return
    await asyncio.gather(pump(client, channel), pump(channel, client))


def session_url(ws_url: str) -> str:
    """The ``/session`` endpoint next to a ``…/ws`` URL."""
    parts = urlsplit(ws_url)
    scheme = {"ws": "http", "wss": "https"}.get(parts.scheme, parts.scheme)
    path = parts.path[: -len("/ws")] if parts.path.endswith("/ws") else parts.path.rstrip("/")
    return urlunsplit((scheme, parts.netloc, f"{path}/session", "", ""))


class WebSocketUpstream:
    """An engine served at a WebSocket URL (``piximi serve`` elsewhere, or
    through a tunnel). With the engine's launch token, every session trades
    it at the engine's ``/session`` for a ticket, as a page would."""

    def __init__(self, url: str, token: str | None = None) -> None:
        self.url = url
        self.token = token

    def describe(self) -> str:
        return self.url

    async def open(self) -> tuple[Transport, str | None]:
        ticket = await asyncio.to_thread(self._trade_token) if self.token else None
        return await connect(self.url), ticket

    def _trade_token(self) -> str:
        request = urllib.request.Request(
            session_url(self.url),
            data=json.dumps({"token": self.token}).encode(),
            headers={"content-type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read())["ticket"]

    async def close(self) -> None:
        return None
