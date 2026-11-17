"""WebSocket transport over a Starlette (ASGI) connection, for serving the
protocol from the same app that serves the frontend bundle."""

from __future__ import annotations

from starlette.websockets import WebSocket, WebSocketDisconnect, WebSocketState

from ..transport import TransportClosed
from .websocket import MAX_FRAME_BYTES


class AsgiWebSocketTransport:
    def __init__(self, websocket: WebSocket) -> None:
        self.max_frame_bytes = MAX_FRAME_BYTES
        self._websocket = websocket

    async def send(self, frame: bytes) -> None:
        if self._websocket.client_state != WebSocketState.CONNECTED:
            raise TransportClosed()
        try:
            await self._websocket.send_bytes(frame)
        except (WebSocketDisconnect, RuntimeError) as error:
            raise TransportClosed() from error

    async def recv(self) -> bytes:
        try:
            return await self._websocket.receive_bytes()
        except (WebSocketDisconnect, RuntimeError) as error:
            raise TransportClosed() from error

    async def close(self) -> None:
        if self._websocket.client_state == WebSocketState.CONNECTED:
            try:
                await self._websocket.close()
            except RuntimeError:
                pass
