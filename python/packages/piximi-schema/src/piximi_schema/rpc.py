"""The message envelope: JSON-RPC 2.0 shapes, minus the ``jsonrpc`` field the
frame version already implies. Encoded as msgpack on the wire."""

from typing import Any

from .base import WireModel

RequestId = int | str


class RequestMessage(WireModel):
    id: RequestId
    method: str
    params: Any | None = None


class ResponseMessage(WireModel):
    id: RequestId
    result: Any | None = None


class RpcError(WireModel):
    code: int
    message: str
    data: Any | None = None


class ErrorResponseMessage(WireModel):
    id: RequestId | None
    error: RpcError


class NotificationMessage(WireModel):
    method: str
    params: Any | None = None


class ProgressValue(WireModel):
    percent: float
    """``0..100``, or ``-1`` while indeterminate."""
    message: str


class ProgressParams(WireModel):
    """``$/progress``: the caller supplied ``token`` in the request's params."""

    token: str
    value: Any
    """A ``ProgressValue``, or a method-specific partial result."""


class CancelParams(WireModel):
    """``$/cancelRequest``."""

    id: RequestId


# Standard JSON-RPC codes.
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INVALID_PARAMS = -32602
INTERNAL_ERROR = -32603
# As in the Language Server Protocol.
REQUEST_CANCELLED = -32800
# A backend operation failed; ``error.data`` is a ``BackendErrorData``.
BACKEND_ERROR = -32000
