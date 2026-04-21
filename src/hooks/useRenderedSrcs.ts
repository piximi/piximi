import { useEffect, useState } from "react";
import { Image as IJSImage, encodeDataURL } from "image-js-latest";
import { BBox, ExtendedChannel } from "store/dataV2/types";
import { DataConnector } from "utils/data-connector";
import { createLUT } from "utils/colorUtils";

/**
 * Returns the rendered preview src for an entity.
 *
 * - Legacy path: returns entity.src directly
 * - New pipeline: loads renderedSrc from IndexedDB StoredTensorData
 */
export function useRenderedSrc(
  channels: ExtendedChannel[],
  crop?: BBox,
): {
  src: string;
  loading: boolean;
} {
  const [indexedDBSrc, setIndexedDBSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channels.length === 0) {
      setIndexedDBSrc("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const storage = DataConnector.getInstance();
        const result = await storage.retrieveBatch(
          channels.map((e) => ({
            id: e.storageReference.storageId,
            storeName: e.storageReference.storeName,
          })),
        );
        if (!cancelled && result.success) {
          const { width, height, bitDepth } = result.data.get(
            channels[0].storageReference.storageId,
          )!;
          const [x0, y0, x1, y1] = crop ?? [0, 0, width, height];
          const outW = x1 - x0;
          const outH = y1 - y0;
          const pixelCount = outW * outH;
          const rgbBuffer = new Uint8Array(pixelCount * 3);

          const luts = [...result.data.values()].map(({ data }, idx) => {
            const { rampMin, rampMax, colorMap } = channels[idx];
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
          setIndexedDBSrc(url);
        }
      } catch (error) {
        // Fall back to empty src
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [channels]);

  return { src: indexedDBSrc, loading };
}
