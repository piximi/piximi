"""Frames over a QUIC stream, and the endpoint both sides bind.

A QUIC stream is a byte stream, so each frame goes out behind its length
(``u32``, big-endian). Frames are at most a WebSocket's size, so a gateway
forwards a browser's frames whole, without re-chunking.
"""

from __future__ import annotations

import asyncio
import struct
from typing import Any

import iroh
import msgpack

from ..transport import TransportClosed
from ..transports.websocket import MAX_FRAME_BYTES

ALPN = b"piximi/link/1"
LENGTH = struct.Struct("!I")
CONTROL_MAX_BYTES = 64 * 1024


def bind_loop() -> None:
    """iroh's coroutines resolve on the asyncio loop it was given; give it
    the running one (again per loop, as tests make a loop each)."""
    iroh.iroh_ffi.uniffi_set_event_loop(asyncio.get_running_loop())


def relay_options(relay: str) -> dict[str, Any]:
    """``default`` (n0's public relays: fine for trying things, rate-limited),
    ``disabled`` (direct addresses only, e.g. one network or tests), or the
    URL of a relay you run (``iroh-relay``)."""
    if relay == "default":
        return {"preset": iroh.preset_n0(), "relay_mode": iroh.RelayMode.default_mode()}
    if relay == "disabled":
        return {"preset": iroh.preset_minimal(), "relay_mode": iroh.RelayMode.disabled()}
    if relay.startswith(("http://", "https://")):
        return {"preset": iroh.preset_n0(), "relay_mode": iroh.RelayMode.custom_from_urls([relay])}
    raise ValueError(f"A relay is 'default', 'disabled' or a URL, not {relay!r}")


async def bind_endpoint(key: bytes, relay: str, *, accept: bool) -> Any:
    bind_loop()
    options = iroh.EndpointOptions(
        secret_key=key, alpns=[ALPN] if accept else [], **relay_options(relay)
    )
    return await iroh.Endpoint.bind(options)


def path_kind(connection: Any) -> str:
    """``direct`` or ``relayed``, for logs (``unknown`` before a path settles)."""
    try:
        selected = next((path for path in connection.paths() if path.is_selected), None)
    except Exception:
        return "unknown"
    if selected is None:
        return "unknown"
    return "direct" if selected.is_ip else "relayed"


class IrohStreamTransport:
    """One bidirectional QUIC stream as a ``Transport``."""

    def __init__(self, send: Any, recv: Any, max_frame_bytes: int = MAX_FRAME_BYTES) -> None:
        self.max_frame_bytes = max_frame_bytes
        self._send = send
        self._recv = recv
        self._lock = asyncio.Lock()
        # Only the sending half: the other side ending its half (EOF on
        # ours) must not stop us finishing this one, or it never sees EOF.
        self._finished = False

    @classmethod
    def of(cls, bi: Any) -> IrohStreamTransport:
        return cls(bi.send(), bi.recv())

    async def send(self, frame: bytes) -> None:
        if self._finished:
            raise TransportClosed()
        async with self._lock:
            try:
                await self._send.write_all(LENGTH.pack(len(frame)) + frame)
            except iroh.IrohError as error:
                raise TransportClosed() from error

    async def recv(self) -> bytes:
        try:
            header = await self._recv.read_exact(LENGTH.size)
            (length,) = LENGTH.unpack(header)
            if length > self.max_frame_bytes:
                raise TransportClosed(f"A {length}-byte frame exceeds {self.max_frame_bytes}")
            return await self._recv.read_exact(length)
        except iroh.IrohError as error:
            raise TransportClosed() from error

    async def close(self) -> None:
        if self._finished:
            return
        self._finished = True
        try:
            await self._send.finish()
        except iroh.IrohError:
            pass


async def send_control(transport: IrohStreamTransport, message: dict) -> None:
    await transport.send(msgpack.packb(message, use_bin_type=True))


async def recv_control(transport: IrohStreamTransport) -> dict:
    value = msgpack.unpackb(await transport.recv(), raw=False)
    if not isinstance(value, dict):
        raise TransportClosed("Malformed control message")
    return value
