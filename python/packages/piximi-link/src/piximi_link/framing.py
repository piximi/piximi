"""The outer frame, which a relay can forward without decoding the message::

    u8 version | u8 flags | u32 message_seq | u32 chunk_index | payload

A message larger than a transport's frame limit is split into chunks that
share a ``message_seq``; the last one carries FIN. Chunks arrive in order (the
transports are ordered streams), so the receiver only concatenates. Integers
are big-endian. Mirrors ``src/core/backend/remote/rpc/framing.ts``.
"""

import struct
from collections.abc import Iterator

FRAME_VERSION = 1
HEADER = struct.Struct("!BBII")
HEADER_BYTES = HEADER.size

FLAG_FIN = 0b001
FLAG_CHUNK = 0b010
FLAG_COMPRESSED = 0b100
"""Reserved: payload compression."""


class FramingError(Exception):
    pass


def frame_message(payload: bytes, message_seq: int, max_frame_bytes: int) -> Iterator[bytes]:
    chunk_bytes = max_frame_bytes - HEADER_BYTES
    if chunk_bytes <= 0:
        raise ValueError(f"max_frame_bytes must exceed the {HEADER_BYTES}-byte header")
    chunks = max(1, -(-len(payload) // chunk_bytes))
    for index in range(chunks):
        flags = (FLAG_FIN if index == chunks - 1 else 0) | (FLAG_CHUNK if chunks > 1 else 0)
        header = HEADER.pack(FRAME_VERSION, flags, message_seq & 0xFFFFFFFF, index)
        yield header + payload[index * chunk_bytes : (index + 1) * chunk_bytes]


class Reassembler:
    """Concatenates a message's frames; several messages may be in flight."""

    def __init__(self) -> None:
        self._partial: dict[int, list[bytes]] = {}

    def push(self, frame: bytes) -> bytes | None:
        if len(frame) < HEADER_BYTES:
            raise FramingError("Frame too short")
        version, flags, message_seq, chunk_index = HEADER.unpack_from(frame)
        if version != FRAME_VERSION:
            raise FramingError(f"Unsupported frame version {version}")
        chunks = self._partial.get(message_seq, [])
        if chunk_index != len(chunks):
            self._partial.pop(message_seq, None)
            raise FramingError(
                f"Frame {chunk_index} of message {message_seq} out of order (expected {len(chunks)})"
            )
        chunks.append(frame[HEADER_BYTES:])
        if not flags & FLAG_FIN:
            self._partial[message_seq] = chunks
            return None
        self._partial.pop(message_seq, None)
        return chunks[0] if len(chunks) == 1 else b"".join(chunks)
