from typing import Protocol


class TransportClosed(Exception):
    """Raised by ``recv`` once the other side has gone."""


class Transport(Protocol):
    """An ordered, framed, bidirectional byte channel.

    WebSocket, an in-memory loopback for tests, and later a WebRTC data
    channel all fit; the peer never sees the difference.
    """

    max_frame_bytes: int
    """Largest frame this transport delivers whole, header included."""

    async def send(self, frame: bytes) -> None: ...

    async def recv(self) -> bytes:
        """The next frame; raises ``TransportClosed`` when there are no more."""
        ...

    async def close(self) -> None: ...
