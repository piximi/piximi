import { describe, expect, it } from "vitest";

import { compositeChannels } from "./compositeChannels";

import type { ColorMap } from "core/entities";

import type { CompositeLayer, StoredPixels } from "./compositeChannels";

const layer = (pixelKey: string, colorMap: ColorMap): CompositeLayer => ({
  pixelKey,
  colorMap,
  rampMin: 0,
  rampMax: 255,
});

const pixels = (values: number[]): StoredPixels => ({
  data: Uint8Array.from(values).buffer,
  width: values.length,
  height: 1,
  bitDepth: 8,
});

describe("compositeChannels", () => {
  it("pairs pixel buffers with layers by key, not by position", () => {
    const red = layer("red", [1, 0, 0]);
    const blue = layer("blue", [0, 0, 1]);
    // Stored in the opposite order to the layer list.
    const stored = new Map([
      ["blue", pixels([0, 255])],
      ["red", pixels([255, 0])],
    ]);

    const { width, height, data } = compositeChannels([red, blue], stored);

    expect([width, height]).toEqual([2, 1]);
    expect([...data]).toEqual([255, 0, 0, 0, 0, 255]);
  });

  it("sums layers additively and saturates at 255", () => {
    const a = layer("a", [1, 1, 0]);
    const b = layer("b", [1, 0, 0]);
    const stored = new Map([
      ["a", pixels([200])],
      ["b", pixels([200])],
    ]);

    const { data } = compositeChannels([a, b], stored);

    expect([...data]).toEqual([255, 200, 0]);
  });

  it("crops to the bounding box", () => {
    const grey = layer("grey", [1, 1, 1]);
    const stored = new Map([["grey", pixels([10, 20, 30])]]);

    const { width, data } = compositeChannels([grey], stored, [1, 0, 3, 1]);

    expect(width).toBe(2);
    expect([...data]).toEqual([20, 20, 20, 30, 30, 30]);
  });

  it("throws when a layer's pixel data is missing", () => {
    const red = layer("red", [1, 0, 0]);

    expect(() => compositeChannels([red], new Map())).toThrow("red");
  });
});
