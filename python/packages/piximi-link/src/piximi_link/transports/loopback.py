"""Two in-memory transports wired to each other, for tests. A small frame
limit forces chunking."""

from __future__ import annotations

import asyncio

from ..transport import TransportClosed


class LoopbackTransport:
    def __init__(self, max_frame_bytes: int) -> None:
        self.max_frame_bytes = max_frame_bytes
        self.peer: LoopbackTransport
        self._inbox: asyncio.Queue[bytes | None] = asyncio.Queue()
        self._closed = False

    async def send(self, frame: bytes) -> None:
        if self._closed:
            raise TransportClosed()
        await self.peer._inbox.put(frame)

    async def recv(self) -> bytes:
        frame = await self._inbox.get()
        if frame is None:
            raise TransportClosed()
        return frame

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        await self._inbox.put(None)
        await self.peer._inbox.put(None)
        self.peer._closed = True


def loopback_pair(max_frame_bytes: int = 4096) -> tuple[LoopbackTransport, LoopbackTransport]:
    a = LoopbackTransport(max_frame_bytes)
    b = LoopbackTransport(max_frame_bytes)
    a.peer, b.peer = b, a
    return a, b
