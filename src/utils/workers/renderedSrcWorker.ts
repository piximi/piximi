import { Image as IJSImage, encodeDataURL } from "image-js-latest";
import * as Comlink from "comlink";

import type { BBox, ExtendedChannel } from "store/data/types";

import "./workerPolyfills";

import { DataConnector } from "core/data-connector";

import { createLUT } from "utils/colorUtils";
import { getCacheKey } from "utils/renderedSrcsCache";

const renderSrcs = async (
  items: Array<{
    channelsRef: ExtendedChannel[];
    boundingBox?: BBox;
  }>,
) => {
  const storage = DataConnector.getInstance();
  const cacheResults: Array<
    { key: string; url: string } | { key: string; error: Error }
  > = [];
  for (const item of items) {
    const cacheKey = getCacheKey(item.channelsRef, item.boundingBox);
    try {
      const result = await storage.retrieveBatch(
        item.channelsRef.map((e) => ({
          id: e.storageReference.storageId,
          storeName: e.storageReference.storeName,
        })),
      );
      if (result.success) {
        const { width, height, bitDepth } = result.data.get(
          item.channelsRef[0].storageReference.storageId,
        )!;
        const [x0, y0, x1, y1] = item.boundingBox ?? [0, 0, width, height];
        const outW = x1 - x0;
        const outH = y1 - y0;
        const pixelCount = outW * outH;
        const rgbBuffer = new Uint8Array(pixelCount * 3);

        const luts = [...result.data.values()].map(({ data }, idx) => {
          const { rampMin, rampMax, colorMap } = item.channelsRef[idx];
          const lut = createLUT({
            bitDepth,
            colorMap,
            min: rampMin,
            max: rampMax,
          });
          return {
            buffer:
              bitDepth === 8 ? new Uint8Array(data) : new Uint16Array(data),
            lut,
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
        const colorImage = new IJSImage(outW, outH, {
          data: rgbBuffer,
        });
        const url = encodeDataURL(colorImage);

        cacheResults.push({ key: cacheKey, url });
      } else {
        cacheResults.push({ key: cacheKey, error: result.error });
      }
    } catch (error) {
      // Fall back to empty src
      cacheResults.push({ key: cacheKey, error: error as Error });
    }
  }
  return cacheResults;
};

Comlink.expose({ renderSrcs });
