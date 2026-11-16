"""Messages are msgpack so that pixel buffers travel as native binary:
``bytes`` values encode as msgpack ``bin`` and decode back as ``bytes``."""

from typing import Any

import msgpack


class CodecError(Exception):
    pass


def encode_message(message: dict[str, Any]) -> bytes:
    return msgpack.packb(message, use_bin_type=True)


def decode_message(data: bytes) -> dict[str, Any]:
    try:
        value = msgpack.unpackb(data, raw=False)
    except Exception as error:  # msgpack raises several unrelated types
        raise CodecError(f"Malformed message: {error}") from error
    if not isinstance(value, dict) or not (
        isinstance(value.get("method"), str)
        or ("id" in value and ("result" in value or "error" in value))
    ):
        raise CodecError("Not an RPC message")
    return value
