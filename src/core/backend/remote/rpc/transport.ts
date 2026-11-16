/*
 * An ordered, framed, bidirectional byte channel. WebSocket, a loopback pair
 * for tests, and later a WebRTC DataChannel all fit; the peer never sees the
 * difference.
 */
export interface Transport {
  /* Largest frame this transport delivers whole, header included. */
  readonly maxFrameBytes: number;
  send(frame: Uint8Array<ArrayBuffer>): void;
  onFrame(listener: (frame: Uint8Array) => void): () => void;
  onClose(listener: (reason?: Error) => void): () => void;
  close(): void;
}
