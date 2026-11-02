import { Image as IJSImage, encodeDataURL } from "image-js-latest";

import { DataConnector } from "core/data-connector";

import { createLUT } from "utils/colorUtils";
import {
  getCacheKey,
  getRenderedSrc,
  setRenderedSrc,
} from "utils/renderedSrcsCache";

import { useKeyedAsync } from "./useKeyedAsync";

import type { BBox, ExtendedChannel } from "core/entities";

const renderToDataUrl = async (
  visibleChannels: ExtendedChannel[],
  crop: BBox | undefined,
  key: string,
): Promise<string | undefined> => {
  const result = await DataConnector.getInstance().retrieveBatch(
    visibleChannels.map((c) => ({
      id: c.storageReference.storageId,
      storeName: c.storageReference.storeName,
    })),
  );
  if (!result.success) return undefined;

  const { width, height, bitDepth } = result.data.get(
    visibleChannels[0].storageReference.storageId,
  )!;
  const [x0, y0, x1, y1] = crop ?? [0, 0, width, height];
  const outW = x1 - x0;
  const outH = y1 - y0;
  const rgbBuffer = new Uint8Array(outW * outH * 3);

  const luts = [...result.data.values()].map(({ data }, idx) => {
    const { rampMin, rampMax, colorMap } = visibleChannels[idx];
    return {
      buffer: bitDepth === 8 ? new Uint8Array(data) : new Uint16Array(data),
      lut: createLUT({ bitDepth, colorMap, min: rampMin, max: rampMax }),
    };
  });
  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const srcIdx = (y0 + row) * width + (x0 + col);
      const dstIdx = row * outW + col;
      let r = 0,
        g = 0,
        b = 0;
      for (const { buffer, lut } of luts) {
        const v = buffer[srcIdx];
        r += lut[0][v];
        g += lut[1][v];
        b += lut[2][v];
      }
      rgbBuffer[dstIdx * 3 + 0] = Math.min(255, r);
      rgbBuffer[dstIdx * 3 + 1] = Math.min(255, g);
      rgbBuffer[dstIdx * 3 + 2] = Math.min(255, b);
    }
  }

  const url = encodeDataURL(new IJSImage(outW, outH, { data: rgbBuffer }));
  setRenderedSrc(key, url);
  return url;
};
/**
 * Returns the rendered preview src for an entity.
 *
 * Keyed on getCacheKey (storage ids + ramp + colour map + visibility + crop):
 * the colours are baked into the PNG, so any of those changing re-renders.
 * Cache hits are read during render so they paint on the first commit.
 */
export function useRenderedSrc(
  channels: ExtendedChannel[],
  crop?: BBox,
): {
  src: string;
  loading: boolean;
} {
  const visibleChannels = channels.filter((c) => c.visible);
  const key = visibleChannels.length === 0 ? null : getCacheKey(channels, crop);

  // "" is usePreloadSrcs' "worker in flight" placeholder — treat as a miss
  const cached = key ? getRenderedSrc(key) || undefined : undefined;

  const { latest, loading } = useKeyedAsync(cached ? null : key, () =>
    renderToDataUrl(visibleChannels, crop, key!),
  );

  if (key === null) return { src: "", loading: false };
  return {
    src: cached || latest || "",
    loading: !cached && loading,
  };
}
