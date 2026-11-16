"""Transport and RPC between the Piximi frontend and a backend engine.

Everything here is independent of what the engine does: a symmetric
JSON-RPC peer over msgpack frames, the transports it runs on, and the
errors it maps. The frontend's ``src/core/backend/remote`` is the same
design in TypeScript.
"""

from .errors import BackendError, RequestCancelled, RpcClosedError, RpcRemoteError
from .peer import HandlerContext, Peer
from .transport import Transport, TransportClosed

__all__ = [
    "BackendError",
    "HandlerContext",
    "Peer",
    "RequestCancelled",
    "RpcClosedError",
    "RpcRemoteError",
    "Transport",
    "TransportClosed",
]
