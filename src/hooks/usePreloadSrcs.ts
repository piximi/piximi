import { useEffect } from "react";
import * as Comlink from "comlink";
import { BBox, ExtendedChannel, ExtendedImageObject } from "store/data/types";
import {
  getCacheKey,
  getRenderedSrc,
  setRenderedSrc,
} from "utils/renderedSrcsCache";

type RenderSrcsWorkerResult = Array<
  { key: string; url: string } | { key: string; error: Error }
>;
interface RenderedSrcWorkerAPI {
  renderSrcs(
    items: Array<{
      channelsRef: ExtendedChannel[];
      boundingBox?: BBox;
    }>,
  ): Promise<RenderSrcsWorkerResult>;
}
export const usePreloadSrcs = <
  T extends Pick<ExtendedImageObject, "channelsRef"> & { boundingBox?: BBox },
>(
  items: Array<T>,
  windowCount: number,
) => {
  useEffect(() => {
    if (items.length === 0 || !Number.isInteger(windowCount)) return;
    // immediately setting the cache map prevents `useRenderedSrcs` from
    // performing identical, simultaneous computation
    items.forEach((item) => {
      const cacheKey = getCacheKey(item.channelsRef, item.boundingBox);
      if (!getRenderedSrc(cacheKey)) setRenderedSrc(cacheKey, "");
    });
    const computeRenderedSrcs = () => {
      const operantItems = items.filter(
        (item) =>
          getRenderedSrc(getCacheKey(item.channelsRef, item.boundingBox)) ===
          "",
      );

      const workers: Worker[] = [];

      const spawnWorker = (group: typeof operantItems) => {
        if (group.length === 0) return;
        const worker = new Worker(
          new URL("../utils/workers/renderedSrcWorker.ts", import.meta.url),
          { type: "module" },
        );
        workers.push(worker);
        const proxy = Comlink.wrap<RenderedSrcWorkerAPI>(worker);
        proxy.renderSrcs(group).then((results) => {
          results.forEach((result) => {
            if ("url" in result) setRenderedSrc(result.key, result.url);
          });
          worker.terminate();
        });
      };
      const groupCutoff1 =
        Math.floor((operantItems.length - windowCount) / 3) + windowCount;
      const groupCutoff2 =
        Math.floor((operantItems.length - windowCount) / 3) + groupCutoff1;

      spawnWorker(operantItems.slice(0, windowCount));
      spawnWorker(operantItems.slice(windowCount, groupCutoff1));
      spawnWorker(operantItems.slice(groupCutoff1, groupCutoff2));
      spawnWorker(operantItems.slice(groupCutoff2));

      return workers;
    };
    const workers = computeRenderedSrcs();
    return () => workers.forEach((w) => w.terminate());
  }, [items, windowCount]);
};
