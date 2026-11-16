import type { Transport } from "../rpc/transport";

/* Browsers and Python's `websockets` both take 1 MiB frames comfortably. */
const WEBSOCKET_MAX_FRAME_BYTES = 1024 * 1024;

export class WebSocketTransport implements Transport {
  readonly maxFrameBytes = WEBSOCKET_MAX_FRAME_BYTES;
  readonly #socket: WebSocket;
  readonly #frameListeners = new Set<(frame: Uint8Array) => void>();
  readonly #closeListeners = new Set<(reason?: Error) => void>();
  #closed = false;

  constructor(socket: WebSocket) {
    this.#socket = socket;
    socket.binaryType = "arraybuffer";
    socket.addEventListener("message", (event) => {
      if (!(event.data instanceof ArrayBuffer)) return;
      const frame = new Uint8Array(event.data);
      for (const listener of this.#frameListeners) listener(frame);
    });
    socket.addEventListener("close", (event) =>
      this.#handleClose(
        event.wasClean
          ? undefined
          : new Error(`WebSocket closed (${event.code}) ${event.reason}`),
      ),
    );
    socket.addEventListener("error", () =>
      this.#handleClose(new Error("WebSocket error")),
    );
  }

  /* Resolves once the socket is open, so the first send cannot be dropped. */
  static connect(url: string): Promise<WebSocketTransport> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.addEventListener(
        "open",
        () => resolve(new WebSocketTransport(socket)),
        {
          once: true,
        },
      );
      socket.addEventListener(
        "error",
        () => reject(new Error(`Could not connect to ${url}`)),
        { once: true },
      );
    });
  }

  send(frame: Uint8Array<ArrayBuffer>): void {
    this.#socket.send(frame);
  }

  onFrame(listener: (frame: Uint8Array) => void): () => void {
    this.#frameListeners.add(listener);
    return () => {
      this.#frameListeners.delete(listener);
    };
  }

  onClose(listener: (reason?: Error) => void): () => void {
    this.#closeListeners.add(listener);
    return () => {
      this.#closeListeners.delete(listener);
    };
  }

  close(): void {
    if (this.#socket.readyState < WebSocket.CLOSING) this.#socket.close();
    this.#handleClose();
  }

  #handleClose(reason?: Error): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const listener of this.#closeListeners) listener(reason);
  }
}
