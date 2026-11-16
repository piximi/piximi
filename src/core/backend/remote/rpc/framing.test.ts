import { describe, expect, it } from "vitest";

import {
  FRAME_VERSION,
  HEADER_BYTES,
  Reassembler,
  frameMessage,
} from "./framing";

const bytes = (length: number) =>
  Uint8Array.from({ length }, (_, i) => (i * 7 + 3) % 256);

const roundTrip = (payload: Uint8Array, maxFrameBytes: number) => {
  const reassembler = new Reassembler();
  const frames = [...frameMessage(payload, 42, maxFrameBytes)];
  let result: Uint8Array | null = null;
  for (const frame of frames) {
    expect(result).toBeNull();
    result = reassembler.push(frame);
  }
  return { frames, result };
};

describe("framing", () => {
  it("sends a small message as one FIN frame", () => {
    const { frames, result } = roundTrip(bytes(5), 64);
    expect(frames).toHaveLength(1);
    expect(frames[0].byteLength).toBe(HEADER_BYTES + 5);
    expect(frames[0][0]).toBe(FRAME_VERSION);
    expect(result).toEqual(bytes(5));
  });

  it("sends an empty message as one frame", () => {
    const { frames, result } = roundTrip(new Uint8Array(0), 64);
    expect(frames).toHaveLength(1);
    expect(result).toEqual(new Uint8Array(0));
  });

  it("chunks a message at the frame limit and reassembles it", () => {
    const payload = bytes(1000);
    const { frames, result } = roundTrip(payload, 64 + HEADER_BYTES);
    expect(frames).toHaveLength(Math.ceil(1000 / 64));
    expect(frames.every((f) => f.byteLength <= 64 + HEADER_BYTES)).toBe(true);
    expect(result).toEqual(payload);
  });

  it("keeps several interleaved messages apart", () => {
    const reassembler = new Reassembler();
    const a = [...frameMessage(bytes(100), 1, 40 + HEADER_BYTES)];
    const b = [...frameMessage(bytes(90), 2, 40 + HEADER_BYTES)];
    const results: Uint8Array[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      for (const frame of [a[i], b[i]]) {
        if (!frame) continue;
        const done = reassembler.push(frame);
        if (done) results.push(done);
      }
    }
    expect(results).toEqual([bytes(100), bytes(90)]);
  });

  it("rejects a frame from an unknown version", () => {
    const [frame] = frameMessage(bytes(3), 1, 64);
    frame[0] = 9;
    expect(() => new Reassembler().push(frame)).toThrow("version 9");
  });

  it("rejects a chunk that arrives out of order", () => {
    const [, second] = frameMessage(bytes(100), 1, 40 + HEADER_BYTES);
    expect(() => new Reassembler().push(second)).toThrow("out of order");
  });
});
