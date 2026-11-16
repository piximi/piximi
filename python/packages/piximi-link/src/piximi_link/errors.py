from typing import Any

from piximi_schema.errors import ErrorCode
from piximi_schema.rpc import (
    BACKEND_ERROR,
    INTERNAL_ERROR,
    REQUEST_CANCELLED,
)


class BackendError(Exception):
    """A backend operation failed; becomes a ``BackendError`` on the frontend."""

    def __init__(self, code: ErrorCode | str, message: str) -> None:
        super().__init__(message)
        self.code = ErrorCode(code)
        self.message = message


class RequestCancelled(Exception):
    """Raised by a handler that stopped because the caller cancelled."""


class RpcRemoteError(Exception):
    """An error the other peer reported that maps to nothing more specific."""

    def __init__(self, code: int, message: str, data: Any = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.data = data


class RpcClosedError(Exception):
    """The connection went away with requests still pending."""


def to_rpc_error(error: BaseException) -> dict[str, Any]:
    """What a handler raised, as the error response it becomes."""
    if isinstance(error, RequestCancelled):
        return {"code": REQUEST_CANCELLED, "message": "Request cancelled"}
    if isinstance(error, BackendError):
        return {
            "code": BACKEND_ERROR,
            "message": error.message,
            "data": {"code": error.code.value, "message": error.message},
        }
    if isinstance(error, RpcRemoteError):
        return {"code": error.code, "message": error.message, "data": error.data}
    return {"code": INTERNAL_ERROR, "message": str(error) or type(error).__name__}


def from_rpc_error(error: dict[str, Any]) -> Exception:
    """An error response, as the exception a caller should see."""
    code = error.get("code")
    message = error.get("message", "")
    data = error.get("data")
    if code == REQUEST_CANCELLED:
        return RequestCancelled(message)
    if code == BACKEND_ERROR and isinstance(data, dict) and isinstance(data.get("code"), str):
        try:
            return BackendError(data["code"], data.get("message", message))
        except ValueError:
            pass
    return RpcRemoteError(code, message, data)
