import { Image as IJSImage, encodeDataURL } from "image-js-latest";

import { createLUT } from "utils/colorUtils";

import type { StoredChannelData } from "core/data-connector/types";
import type { BBox, ExtendedChannel } from "core/entities";

export type StoredPixels = Pick<
  StoredChannelData,
  "data" | "width" | "height" | "bitDepth"
>;

/**
 * Additively composites channels into an RGB buffer: each channel's pixels go
 * through their own colour LUT (ramp + colour map) and the results are summed,
 * saturating at 255.
 *
 * Pixel buffers are looked up by storage id rather than paired by position, so
 * `stored` may hold them in any order.
 */
export function compositeChannels(
  channels: ExtendedChannel[],
  stored: ReadonlyMap<string, StoredPixels>,
  crop?: BBox,
): { width: number; height: number; data: Uint8Array } {
  if (channels.length === 0) {
    throw new Error("compositeChannels: no channels to render");
  }

  const layers = channels.map((channel) => {
    const id = channel.storageReference.storageId;
    const pixels = stored.get(id);
    if (!pixels) {
      throw new Error(`compositeChannels: no pixel data for channel ${id}`);
    }
    return {
      pixels,
      buffer:
        pixels.bitDepth === 8
          ? new Uint8Array(pixels.data)
          : new Uint16Array(pixels.data),
      lut: createLUT({
        bitDepth: pixels.bitDepth,
        colorMap: channel.colorMap,
        min: channel.rampMin,
        max: channel.rampMax,
      }),
    };
  });

  const { width, height } = layers[0].pixels;
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
      for (const { buffer, lut } of layers) {
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
  channels: ExtendedChannel[],
  stored: ReadonlyMap<string, StoredPixels>,
  crop?: BBox,
): string {
  const { width, height, data } = compositeChannels(channels, stored, crop);
  return encodeDataURL(new IJSImage(width, height, { data }));
}
