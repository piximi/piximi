"""A symmetric JSON-RPC peer over a framed transport.

Either side may send requests, notifications, progress for a request in
flight, and cancellation, in the manner of the Language Server Protocol.
Mirrors ``src/core/backend/remote/rpc/peer.ts``.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from piximi_schema.rpc import METHOD_NOT_FOUND, PARSE_ERROR

from .codec import CodecError, decode_message, encode_message
from .errors import RequestCancelled, RpcClosedError, from_rpc_error, to_rpc_error
from .framing import FramingError, Reassembler, frame_message
from .transport import Transport, TransportClosed

log = logging.getLogger(__name__)

PROGRESS = "$/progress"
CANCEL = "$/cancelRequest"

RequestId = int | str


class HandlerContext:
    """What a request handler gets besides its params.

    Cancellation is cooperative: a handler doing real work checks
    ``check_cancelled()`` between steps (or awaits ``wait_cancelled()``
    alongside I/O), since nothing can interrupt it otherwise.
    """

    def __init__(self, send_progress: Callable[[Any], None] | None) -> None:
        self._cancelled = asyncio.Event()
        self._send_progress = send_progress

    @property
    def cancelled(self) -> bool:
        return self._cancelled.is_set()

    def cancel(self) -> None:
        """Marks the request cancelled, as the peer's ``$/cancelRequest``
        would; for work cancelled another way, e.g. through its job."""
        self._cancelled.set()

    async def wait_cancelled(self) -> None:
        await self._cancelled.wait()

    def check_cancelled(self) -> None:
        if self._cancelled.is_set():
            raise RequestCancelled()

    def progress(self, value: Any) -> None:
        """Sends a ``$/progress`` value if the caller asked for progress."""
        if self._send_progress is not None:
            self._send_progress(value)

    def with_progress(self, send: Callable[[Any], None]) -> HandlerContext:
        """A context sharing this one's cancellation but reporting progress
        through ``send`` (which may also forward to this one)."""
        derived = HandlerContext(send)
        derived._cancelled = self._cancelled
        return derived


RequestHandler = Callable[[Any, HandlerContext], Awaitable[Any]]
NotificationHandler = Callable[[Any], Any]


class Peer:
    def __init__(self, transport: Transport) -> None:
        self._transport = transport
        self._reassembler = Reassembler()
        self._seq = 0
        self._next_id = 1
        self._closed = False
        self._close_reason: BaseException | None = None

        self._pending: dict[RequestId, asyncio.Future[Any]] = {}
        self._progress: dict[str, Callable[[Any], None]] = {}
        self._inflight: dict[RequestId, tuple[asyncio.Task[None], HandlerContext]] = {}
        self._request_handlers: dict[str, RequestHandler] = {}
        self._notification_handlers: dict[str, NotificationHandler] = {}

        self._outgoing: asyncio.Queue[bytes | None] = asyncio.Queue()
        self._reader: asyncio.Task[None] | None = None
        self._writer: asyncio.Task[None] | None = None
        self._done = asyncio.Event()

    # ── Lifecycle ──────────────────────────────────────────────────────────

    def start(self) -> None:
        if self._reader is not None:
            return
        self._reader = asyncio.create_task(self._read_loop(), name="piximi-link-reader")
        self._writer = asyncio.create_task(self._write_loop(), name="piximi-link-writer")

    async def __aenter__(self) -> Peer:
        self.start()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    @property
    def closed(self) -> bool:
        return self._closed

    async def wait_closed(self) -> None:
        await self._done.wait()

    async def close(self) -> None:
        if self._closed:
            return
        self._settle_closed(None)
        if self._writer is not None:
            # Let frames already queued (e.g. a final response) drain first.
            await self._outgoing.put(None)
            try:
                await asyncio.wait_for(self._writer, timeout=1)
            except (asyncio.TimeoutError, asyncio.CancelledError, Exception):
                self._writer.cancel()
        if self._reader is not None and self._reader is not asyncio.current_task():
            self._reader.cancel()
        await self._transport.close()
        self._done.set()

    # ── Outgoing ───────────────────────────────────────────────────────────

    async def request(
        self,
        method: str,
        params: Any = None,
        *,
        on_progress: Callable[[Any], None] | None = None,
        cancel: asyncio.Event | None = None,
    ) -> Any:
        """Sends a request and waits for its result.

        ``cancel`` is an event that, once set, sends ``$/cancelRequest``; the
        request then stays pending until the other side answers, with either
        a partial result or a cancellation error.
        """
        if self._closed:
            raise RpcClosedError()
        if cancel is not None and cancel.is_set():
            raise RequestCancelled()

        request_id = self._next_id
        self._next_id += 1
        if on_progress is not None:
            token = str(request_id)
            self._progress[token] = on_progress
            params = {**(params or {}), "progressToken": token}

        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._pending[request_id] = future
        self._enqueue({"id": request_id, "method": method, "params": params})

        watcher = None
        if cancel is not None:
            watcher = asyncio.create_task(self._cancel_when(cancel, request_id))
        try:
            return await future
        finally:
            if watcher is not None:
                watcher.cancel()
            self._progress.pop(str(request_id), None)

    async def _cancel_when(self, cancel: asyncio.Event, request_id: RequestId) -> None:
        await cancel.wait()
        if request_id in self._pending:
            self.notify(CANCEL, {"id": request_id})

    def notify(self, method: str, params: Any = None) -> None:
        if self._closed:
            return
        self._enqueue({"method": method, "params": params})

    # ── Incoming ───────────────────────────────────────────────────────────

    def on_request(self, method: str, handler: RequestHandler) -> None:
        self._request_handlers[method] = handler

    def on_notification(self, method: str, handler: NotificationHandler) -> None:
        self._notification_handlers[method] = handler

    # ── Internals ──────────────────────────────────────────────────────────

    def _enqueue(self, message: dict[str, Any]) -> None:
        payload = encode_message(message)
        for frame in frame_message(payload, self._seq, self._transport.max_frame_bytes):
            self._outgoing.put_nowait(frame)
        self._seq += 1

    async def _write_loop(self) -> None:
        while True:
            frame = await self._outgoing.get()
            if frame is None:
                return
            try:
                await self._transport.send(frame)
            except TransportClosed:
                return
            except Exception as error:
                log.warning("send failed: %s", error)
                return

    async def _read_loop(self) -> None:
        reason: BaseException | None = None
        try:
            while True:
                frame = await self._transport.recv()
                self._receive(frame)
        except TransportClosed:
            pass
        except asyncio.CancelledError:
            raise
        except Exception as error:
            reason = error
        finally:
            self._settle_closed(reason)
            self._done.set()

    def _receive(self, frame: bytes) -> None:
        try:
            payload = self._reassembler.push(frame)
            if payload is None:
                return
            message = decode_message(payload)
        except (FramingError, CodecError) as error:
            self._enqueue({"id": None, "error": {"code": PARSE_ERROR, "message": str(error)}})
            return

        if "method" in message:
            if "id" in message:
                self._handle_request(message["id"], message["method"], message.get("params"))
            else:
                self._handle_notification(message["method"], message.get("params"))
        elif "error" in message:
            if message["id"] is not None:
                self._settle(message["id"], error=message["error"])
        else:
            self._settle(message["id"], result=message.get("result"))

    def _handle_request(self, request_id: RequestId, method: str, params: Any) -> None:
        handler = self._request_handlers.get(method)
        if handler is None:
            self._enqueue(
                {
                    "id": request_id,
                    "error": {"code": METHOD_NOT_FOUND, "message": f'Unknown method "{method}"'},
                }
            )
            return
        token = params.get("progressToken") if isinstance(params, dict) else None
        send_progress = None
        if isinstance(token, str):
            send_progress = lambda value, token=token: self.notify(
                PROGRESS, {"token": token, "value": value}
            )
        context = HandlerContext(send_progress)
        task = asyncio.create_task(
            self._run_handler(request_id, handler, params, context),
            name=f"piximi-link:{method}",
        )
        self._inflight[request_id] = (task, context)

    async def _run_handler(
        self,
        request_id: RequestId,
        handler: RequestHandler,
        params: Any,
        context: HandlerContext,
    ) -> None:
        try:
            result = await handler(params, context)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            if not self._closed:
                self._enqueue({"id": request_id, "error": to_rpc_error(error)})
        else:
            if not self._closed:
                self._enqueue({"id": request_id, "result": result})
        finally:
            self._inflight.pop(request_id, None)

    def _handle_notification(self, method: str, params: Any) -> None:
        if method == CANCEL:
            entry = self._inflight.get(params["id"]) if isinstance(params, dict) else None
            if entry is not None:
                entry[1]._cancelled.set()
            return
        if method == PROGRESS:
            if isinstance(params, dict):
                listener = self._progress.get(params.get("token"))
                if listener is not None:
                    listener(params.get("value"))
            return
        handler = self._notification_handlers.get(method)
        if handler is not None:
            try:
                outcome = handler(params)
                if asyncio.iscoroutine(outcome):
                    asyncio.create_task(outcome)
            except Exception:
                log.exception("notification handler for %s failed", method)

    def _settle(self, request_id: RequestId, *, result: Any = None, error: Any = None) -> None:
        future = self._pending.pop(request_id, None)
        if future is None or future.done():
            return
        if error is not None:
            future.set_exception(from_rpc_error(error))
        else:
            future.set_result(result)

    def _settle_closed(self, reason: BaseException | None) -> None:
        if self._closed:
            return
        self._closed = True
        self._close_reason = reason
        error = RpcClosedError(str(reason) if reason else "Connection closed")
        for future in self._pending.values():
            if not future.done():
                future.set_exception(error)
        self._pending.clear()
        self._progress.clear()
        for task, context in self._inflight.values():
            context._cancelled.set()
            task.cancel()
        self._inflight.clear()
