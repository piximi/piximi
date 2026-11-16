import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";

import type { DataConnector } from "core/data-connector";
import type { BBox, StoreName } from "core/entities";

import type { CompositeLayer } from "utils/image/compositeChannels";

import type { RenderResult, RenderedImage } from "../types";

/* A render request resolved against IndexedDB: layers plus where their pixels are. */
export type ThumbnailItem = {
  layers: CompositeLayer[];
  refs: Array<{ id: string; storeName: StoreName }>;
  crop?: BBox;
};

export interface ThumbnailRenderer {
  render(
    items: ThumbnailItem[],
    signal?: AbortSignal,
  ): AsyncIterable<RenderResult>;
  dispose(): void;
}

/* Shared by the worker and the main-thread renderer, so both draw the same. */
export const renderThumbnailItem = async (
  storage: DataConnector,
  item: ThumbnailItem,
): Promise<RenderedImage> => {
  const result = await storage.retrieveBatch(item.refs);
  if (!result.success) throw result.error;
  const { width, height } = result.data.get(item.refs[0].id)!;
  const [x0, y0, x1, y1] = item.crop ?? [0, 0, width, height];
  return {
    width: x1 - x0,
    height: y1 - y0,
    dataUrl: compositeChannelsToDataUrl(item.layers, result.data, item.crop),
  };
};

/* Renders on the calling thread; for environments without workers (tests). */
export const createMainThreadThumbnailRenderer = (
  storage: DataConnector,
): ThumbnailRenderer => ({
  async *render(items, signal) {
    for (const [index, item] of items.entries()) {
      if (signal?.aborted) return;
      try {
        yield {
          index,
          ok: true,
          image: await renderThumbnailItem(storage, item),
        };
      } catch (error) {
        yield { index, ok: false, error: error as Error };
      }
    }
  },
  dispose() {},
});
