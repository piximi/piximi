import { describe, expect, it } from "vitest";

import { STORES } from "core/entities";

import { compositeChannels } from "./compositeChannels";

import type { ColorMap, ExtendedChannel } from "core/entities";

import type { StoredPixels } from "./compositeChannels";

const makeChannel = (id: string, colorMap: ColorMap): ExtendedChannel => ({
  id,
  planeId: "plane",
  channelMetaId: id,
  name: id,
  dtype: "uint8",
  bitDepth: 8,
  width: 2,
  height: 1,
  minValue: 0,
  maxValue: 255,
  storageReference: {
    storageId: id,
    storeName: STORES.CHANNEL_DATA,
    width: 2,
    height: 1,
    dtype: "uint8",
    byteSize: 2,
  },
  colorMap,
  rampMin: 0,
  rampMax: 255,
  visible: true,
});

const pixels = (values: number[]): StoredPixels => ({
  data: Uint8Array.from(values).buffer,
  width: values.length,
  height: 1,
  bitDepth: 8,
});

describe("compositeChannels", () => {
  it("pairs pixel buffers with channels by id, not by position", () => {
    const red = makeChannel("red", [1, 0, 0]);
    const blue = makeChannel("blue", [0, 0, 1]);
    // Stored in the opposite order to the channel list.
    const stored = new Map([
      ["blue", pixels([0, 255])],
      ["red", pixels([255, 0])],
    ]);

    const { width, height, data } = compositeChannels([red, blue], stored);

    expect([width, height]).toEqual([2, 1]);
    expect([...data]).toEqual([255, 0, 0, 0, 0, 255]);
  });

  it("sums channels additively and saturates at 255", () => {
    const a = makeChannel("a", [1, 1, 0]);
    const b = makeChannel("b", [1, 0, 0]);
    const stored = new Map([
      ["a", pixels([200])],
      ["b", pixels([200])],
    ]);

    const { data } = compositeChannels([a, b], stored);

    expect([...data]).toEqual([255, 200, 0]);
  });

  it("crops to the bounding box", () => {
    const grey = makeChannel("grey", [1, 1, 1]);
    const stored = new Map([["grey", pixels([10, 20, 30])]]);

    const { width, data } = compositeChannels([grey], stored, [1, 0, 3, 1]);

    expect(width).toBe(2);
    expect([...data]).toEqual([20, 20, 20, 30, 30, 30]);
  });

  it("throws when a channel's pixel data is missing", () => {
    const red = makeChannel("red", [1, 0, 0]);

    expect(() => compositeChannels([red], new Map())).toThrow("red");
  });
});
