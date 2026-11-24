"""The gateway's side: an ``Upstream`` that reaches an engine over iroh."""

from __future__ import annotations

import asyncio
import logging
import socket
from pathlib import Path
from typing import Any

import iroh

from ..transport import Transport
from .pairing import Ticket, default_config_dir, load_or_create_key
from .stream import ALPN, IrohStreamTransport, bind_endpoint, path_kind, recv_control, send_control

log = logging.getLogger(__name__)

CONNECT_TIMEOUT = 30.0


class PairingRefused(Exception):
    """The engine would not admit this machine."""


class IrohUpstream:
    """One QUIC connection to the engine named by ``ticket``, dialled on the
    first session and again after it drops; each session is a stream on
    it. The connection is authenticated by keys, so sessions carry no
    ticket of their own upstream."""

    def __init__(self, ticket: Ticket, *, config_dir: Path | None = None, relay: str = "default") -> None:
        self.ticket = ticket
        self.config_dir = config_dir or default_config_dir()
        self.relay = relay
        self.session_id: str | None = None
        self._endpoint: Any = None
        self._connection: Any = None
        self._lock = asyncio.Lock()

    def describe(self) -> str:
        endpoint = self.ticket.endpoint
        return f"iroh engine {endpoint[:16]}…"

    async def connect(self) -> None:
        """Dials and pairs now rather than on the first session, so a bad
        ticket shows at startup."""
        async with self._lock:
            await self._ensure_connected()

    async def open(self) -> tuple[Transport, str | None]:
        async with self._lock:
            connection = await self._ensure_connected()
            try:
                bi = await connection.open_bi()
            except iroh.IrohError:
                # Dropped since the last session (engine restarted, network
                # changed): dial once more.
                self._connection = None
                connection = await self._ensure_connected()
                bi = await connection.open_bi()
        return IrohStreamTransport.of(bi), None

    async def close(self) -> None:
        if self._connection is not None:
            self._connection.close(0, b"gateway stopping")
            self._connection = None
        if self._endpoint is not None:
            await self._endpoint.close()
            self._endpoint = None

    async def _ensure_connected(self) -> Any:
        if self._connection is not None and self._connection.close_reason() is None:
            return self._connection
        if self._endpoint is None:
            key = load_or_create_key(self.config_dir / "iroh" / "key")
            self._endpoint = await bind_endpoint(key, self.relay, accept=False)
        address = iroh.EndpointTicket.from_string(self.ticket.endpoint).endpoint_addr()
        connection = await asyncio.wait_for(self._endpoint.connect(address, ALPN), CONNECT_TIMEOUT)
        control = IrohStreamTransport.of(await connection.open_bi())
        await send_control(control, {"secret": self.ticket.secret, "label": socket.gethostname()})
        reply = await asyncio.wait_for(recv_control(control), CONNECT_TIMEOUT)
        await control.close()
        if not reply.get("ok"):
            connection.close(0, b"refused")
            raise PairingRefused(str(reply.get("reason") or "The engine refused this machine"))
        self.session_id = reply.get("sessionId")
        log.info("connected to %s (%s)", self.describe(), path_kind(connection))
        self._connection = connection
        return connection
