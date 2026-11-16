/*
 * The outer frame, which a relay can forward without decoding the message:
 *
 *   u8 version | u8 flags | u32 messageSeq | u32 chunkIndex | payload
 *
 * A message larger than a transport's frame limit is split into chunks that
 * share a `messageSeq`; the last one carries FIN. Chunks arrive in order (the
 * transports are ordered streams), so the receiver only has to concatenate.
 * All integers are big-endian. Mirrors `piximi_link.framing`.
 */

export const FRAME_VERSION = 1;
export const HEADER_BYTES = 10;

const FLAG_FIN = 0b001;
const FLAG_CHUNK = 0b010;
// Bit 0b100 is reserved for payload compression.

export function* frameMessage(
  payload: Uint8Array,
  messageSeq: number,
  maxFrameBytes: number,
): Generator<Uint8Array<ArrayBuffer>> {
  const chunkBytes = maxFrameBytes - HEADER_BYTES;
  if (chunkBytes <= 0) {
    throw new Error(
      `maxFrameBytes must exceed the ${HEADER_BYTES}-byte header`,
    );
  }
  const chunks = Math.max(1, Math.ceil(payload.byteLength / chunkBytes));
  for (let index = 0; index < chunks; index++) {
    const slice = payload.subarray(
      index * chunkBytes,
      (index + 1) * chunkBytes,
    );
    const frame = new Uint8Array(HEADER_BYTES + slice.byteLength);
    const view = new DataView(frame.buffer);
    view.setUint8(0, FRAME_VERSION);
    view.setUint8(
      1,
      (index === chunks - 1 ? FLAG_FIN : 0) | (chunks > 1 ? FLAG_CHUNK : 0),
    );
    view.setUint32(2, messageSeq >>> 0);
    view.setUint32(6, index);
    frame.set(slice, HEADER_BYTES);
    yield frame;
  }
}

type Header = { flags: number; messageSeq: number; chunkIndex: number };

const readHeader = (frame: Uint8Array): Header => {
  if (frame.byteLength < HEADER_BYTES) throw new Error("Frame too short");
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  const version = view.getUint8(0);
  if (version !== FRAME_VERSION) {
    throw new Error(`Unsupported frame version ${version}`);
  }
  return {
    flags: view.getUint8(1),
    messageSeq: view.getUint32(2),
    chunkIndex: view.getUint32(6),
  };
};

/* Concatenates a message's frames; several messages may be in flight. */
export class Reassembler {
  #partial = new Map<number, Uint8Array[]>();

  push(frame: Uint8Array): Uint8Array | null {
    const { flags, messageSeq, chunkIndex } = readHeader(frame);
    const payload = frame.subarray(HEADER_BYTES);
    const chunks = this.#partial.get(messageSeq) ?? [];
    if (chunkIndex !== chunks.length) {
      this.#partial.delete(messageSeq);
      throw new Error(
        `Frame ${chunkIndex} of message ${messageSeq} out of order (expected ${chunks.length})`,
      );
    }
    chunks.push(payload);
    if (!(flags & FLAG_FIN)) {
      this.#partial.set(messageSeq, chunks);
      return null;
    }
    this.#partial.delete(messageSeq);
    if (chunks.length === 1) return chunks[0];
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const message = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      message.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return message;
  }
}
