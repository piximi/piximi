import type { Transport } from "../rpc/transport";

/*
 * Two in-memory transports wired to each other, for tests. Delivery is
 * asynchronous, as on a real channel, and a small frame limit forces chunking.
 */
export const createLoopbackPair = (
  maxFrameBytes = 4 * 1024,
): [Transport, Transport] => {
  class Side implements Transport {
    readonly maxFrameBytes = maxFrameBytes;
    peer!: Side;
    closed = false;
    readonly #frameListeners = new Set<(frame: Uint8Array) => void>();
    readonly #closeListeners = new Set<(reason?: Error) => void>();

    send(frame: Uint8Array<ArrayBuffer>): void {
      if (this.closed) throw new Error("Transport closed");
      queueMicrotask(() => this.peer.#deliver(frame));
    }

    #deliver(frame: Uint8Array): void {
      if (this.closed) return;
      for (const listener of this.#frameListeners) listener(frame);
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
      if (this.closed) return;
      this.closed = true;
      for (const listener of this.#closeListeners) listener();
      queueMicrotask(() => this.peer.close());
    }
  }

  const a = new Side();
  const b = new Side();
  a.peer = b;
  b.peer = a;
  return [a, b];
};
