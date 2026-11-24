"""The engine's side: serves a hub to gateways that dial this machine."""

from __future__ import annotations

import asyncio
import hmac
import logging
import secrets
from collections.abc import Callable
from pathlib import Path
from typing import Any

import iroh

from piximi_schema import PROTOCOL_VERSION

from ..peer import Peer
from ..session import SessionHub
from ..transport import TransportClosed
from .pairing import SECRET_BYTES, Allowlist, Ticket, load_or_create_key
from .stream import IrohStreamTransport, bind_endpoint, path_kind, recv_control, send_control

log = logging.getLogger(__name__)

HELLO_TIMEOUT = 10.0
ONLINE_TIMEOUT = 15.0


class IrohHost:
    """Accepts gateways over iroh and serves each of their streams to
    ``hub`` as a peer. A connection is admitted if its key is in the
    allowlist, or if it presents the current pairing secret, which then
    admits its key for good and is replaced by a fresh one (``on_paired``
    hears the new ticket)."""

    def __init__(
        self,
        hub: SessionHub,
        state_dir: Path,
        *,
        relay: str = "default",
        on_paired: Callable[[str, Ticket], None] | None = None,
    ) -> None:
        self.hub = hub
        self.state_dir = state_dir
        self.relay = relay
        self.allowlist = Allowlist(state_dir / "authorized.json")
        self.on_paired = on_paired
        self._secret = secrets.token_bytes(SECRET_BYTES)
        self._endpoint: Any = None
        self._tasks: set[asyncio.Task] = set()

    async def start(self) -> None:
        key = load_or_create_key(self.state_dir / "key")
        self._endpoint = await bind_endpoint(key, self.relay, accept=True)
        if self.relay != "disabled":
            # The ticket should name the home relay, which takes a moment.
            try:
                await asyncio.wait_for(self._endpoint.online(), ONLINE_TIMEOUT)
            except TimeoutError:
                log.warning("no relay reachable yet; the ticket has direct addresses only")
        self._spawn(self._accept_loop())

    @property
    def endpoint_id(self) -> str:
        return str(self._endpoint.id())

    def ticket(self, *, with_secret: bool = True) -> Ticket:
        endpoint = str(iroh.EndpointTicket.from_addr(self._endpoint.addr()))
        return Ticket(endpoint, self._secret if with_secret else None)

    async def close(self) -> None:
        for task in list(self._tasks):
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        if self._endpoint is not None:
            await self._endpoint.close()

    def _spawn(self, coroutine) -> None:
        task = asyncio.create_task(coroutine)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _accept_loop(self) -> None:
        while True:
            incoming = await self._endpoint.accept_next()
            if incoming is None:
                return
            self._spawn(self._serve_connection(incoming))

    def _admit(self, remote: str, hello: dict) -> str | None:
        """Why ``remote`` may not connect, or ``None`` if it may."""
        if remote in self.allowlist:
            return None
        secret = hello.get("secret")
        if isinstance(secret, bytes) and hmac.compare_digest(secret, self._secret):
            label = str(hello.get("label") or remote[:10])
            self.allowlist.add(remote, label)
            self._secret = secrets.token_bytes(SECRET_BYTES)
            log.info("paired with %s (%s)", label, remote)
            if self.on_paired is not None:
                self.on_paired(label, self.ticket())
            return None
        if secret is not None:
            return "This ticket's pairing secret has been used; ask for a fresh ticket"
        return "This machine is not paired with the engine; connect once with a ticket that carries a secret"

    async def _serve_connection(self, incoming: Any) -> None:
        connection = None
        try:
            connection = await (await incoming.accept()).connect()
            remote = str(connection.remote_id())
            control = IrohStreamTransport.of(await connection.accept_bi())
            hello = await asyncio.wait_for(recv_control(control), HELLO_TIMEOUT)
            refusal = self._admit(remote, hello)
            if refusal is not None:
                log.warning("refused %s: %s", remote, refusal)
                await send_control(control, {"ok": False, "reason": refusal})
                await control.close()
                await asyncio.sleep(0.2)  # let the refusal reach them
                connection.close(1, b"not paired")
                return
            await send_control(
                control, {"ok": True, "sessionId": self.hub.session_id, "protocolVersion": PROTOCOL_VERSION}
            )
            await control.close()
            log.info("gateway %s connected (%s)", remote[:10], path_kind(connection))
            while True:
                bi = await connection.accept_bi()
                self._spawn(self._serve_session(IrohStreamTransport.of(bi)))
        except (iroh.IrohError, TransportClosed, TimeoutError) as error:
            log.debug("gateway connection ended: %s", error)
        except asyncio.CancelledError:
            if connection is not None:
                connection.close(0, b"engine stopping")
            raise

    async def _serve_session(self, transport: IrohStreamTransport) -> None:
        peer = Peer(transport)
        async with peer:
            # The connection authenticated the gateway, which checked the
            # browser's ticket itself.
            self.hub.attach(peer, trusted=True)
            try:
                await peer.wait_closed()
            finally:
                self.hub.detach(peer)
        # A peer whose reading half ended first counts itself closed without
        # closing its transport; a QUIC stream closes by halves, so finish
        # ours or the gateway waits for it forever.
        await transport.close()
