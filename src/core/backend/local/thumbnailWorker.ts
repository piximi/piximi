import * as Comlink from "comlink";

import "utils/workers/workerPolyfills";

import { DataConnector } from "core/data-connector";
import { CancelSource } from "core/dl/cancel";

import { renderThumbnailItem } from "./thumbnails";

import type { Token } from "core/dl/cancel";

import type { RenderedImage } from "../types";
import type { ThumbnailItem } from "./thumbnails";

export type ThumbnailWorkerResult = { index: number } & (
  | ({ ok: true } & RenderedImage)
  | { ok: false; message: string }
);

export interface ThumbnailWorkerApi {
  renderComposites(
    items: Array<ThumbnailItem & { index: number }>,
    cancelToken: Token,
  ): Promise<ThumbnailWorkerResult[]>;
}

// This worker lives for the session, so keep its own LRU small: the main
// thread already holds the big one, and thumbnails only touch each channel
// briefly.
const storage = DataConnector.getInstance({
  maxMemoryBytes: 64 * 1024 * 1024,
});

const renderComposites: ThumbnailWorkerApi["renderComposites"] = async (
  items,
  cancelToken,
) => {
  const results: ThumbnailWorkerResult[] = [];
  for (const item of items) {
    // One postMessage round trip per item; items are small, so this is where
    // a scrolled-away batch gets dropped promptly.
    if (await CancelSource.isSignaled(cancelToken)) break;
    try {
      const image = await renderThumbnailItem(storage, item);
      results.push({ index: item.index, ok: true, ...image });
    } catch (error) {
      results.push({
        index: item.index,
        ok: false,
        message: (error as Error).message,
      });
    }
  }
  return results;
};

Comlink.expose({ renderComposites });
