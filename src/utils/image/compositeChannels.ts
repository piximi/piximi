import { Image as IJSImage, encodeDataURL } from "image-js-latest";

import { createLUT } from "utils/colorUtils";

import type { StoredChannelData } from "core/data-connector/types";
import type { BBox, ColorMap, ExtendedChannel } from "core/entities";

export type StoredPixels = Pick<
  StoredChannelData,
  "data" | "width" | "height" | "bitDepth"
>;

/* One channel's contribution: which pixels, and how to colour them. */
export type CompositeLayer = {
  pixelKey: string;
  colorMap: ColorMap;
  rampMin: number;
  rampMax: number;
};

export const layerFromChannel = (channel: ExtendedChannel): CompositeLayer => ({
  pixelKey: channel.storageReference.storageId,
  colorMap: channel.colorMap,
  rampMin: channel.rampMin,
  rampMax: channel.rampMax,
});

/**
 * Additively composites layers into an RGB buffer: each layer's pixels go
 * through their own colour LUT (ramp + colour map) and the results are summed,
 * saturating at 255.
 *
 * Pixel buffers are looked up by `pixelKey` rather than paired by position, so
 * `pixels` may hold them in any order.
 */
export function compositeChannels(
  layers: CompositeLayer[],
  pixels: ReadonlyMap<string, StoredPixels>,
  crop?: BBox,
): { width: number; height: number; data: Uint8Array } {
  if (layers.length === 0) {
    throw new Error("compositeChannels: no layers to render");
  }

  const resolved = layers.map((layer) => {
    const stored = pixels.get(layer.pixelKey);
    if (!stored) {
      throw new Error(
        `compositeChannels: no pixel data for layer ${layer.pixelKey}`,
      );
    }
    return {
      stored,
      buffer:
        stored.bitDepth === 8
          ? new Uint8Array(stored.data)
          : new Uint16Array(stored.data),
      lut: createLUT({
        bitDepth: stored.bitDepth,
        colorMap: layer.colorMap,
        min: layer.rampMin,
        max: layer.rampMax,
      }),
    };
  });

  const { width, height } = resolved[0].stored;
  const [x0, y0, x1, y1] = crop ?? [0, 0, width, height];
  const outW = x1 - x0;
  const outH = y1 - y0;
  const rgb = new Uint8Array(outW * outH * 3);

  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const srcIdx = (y0 + row) * width + (x0 + col);
      const dstIdx = (row * outW + col) * 3;
      let r = 0,
        g = 0,
        b = 0;
      for (const { buffer, lut } of resolved) {
        const v = buffer[srcIdx];
        r += lut[0][v];
        g += lut[1][v];
        b += lut[2][v];
      }
      rgb[dstIdx] = Math.min(255, r);
      rgb[dstIdx + 1] = Math.min(255, g);
      rgb[dstIdx + 2] = Math.min(255, b);
    }
  }

  return { width: outW, height: outH, data: rgb };
}

export function compositeChannelsToDataUrl(
  layers: CompositeLayer[],
  pixels: ReadonlyMap<string, StoredPixels>,
  crop?: BBox,
): string {
  const { width, height, data } = compositeChannels(layers, pixels, crop);
  return encodeDataURL(new IJSImage(width, height, { data }));
}
