import { useEffect } from "react";

import { toChannelDisplay, useBackend } from "core/backend";

import {
  getCacheKey,
  getRenderedSrc,
  setRenderedSrc,
} from "utils/renderedSrcsCache";

import type { BBox, ExtendedImageObject } from "core/entities";

/*
 * Warms the rendered-src cache for grid items ahead of their render. Items are
 * requested in the order given, so pass the visible window first; the backend
 * completes earlier requests first and drops the rest when the effect is
 * cleaned up.
 */
export const usePreloadSrcs = <
  T extends Pick<ExtendedImageObject, "channelsRef"> & { boundingBox?: BBox },
>(
  items: Array<T>,
) => {
  const backend = useBackend();
  useEffect(() => {
    if (items.length === 0) return;
    // immediately setting the cache map prevents `useRenderedSrcs` from
    // performing identical, simultaneous computation
    const pending = items
      .map((item) => ({
        key: getCacheKey(item.channelsRef, item.boundingBox),
        item,
      }))
      .filter(({ key }) => !getRenderedSrc(key));
    for (const { key } of pending) setRenderedSrc(key, "");

    const controller = new AbortController();
    void (async () => {
      const results = backend.render.thumbnails(
        pending.map(({ item }) => ({
          channels: item.channelsRef.map(toChannelDisplay),
          region: item.boundingBox,
        })),
        { signal: controller.signal },
      );
      for await (const result of results) {
        if (result.ok)
          setRenderedSrc(pending[result.index].key, result.image.dataUrl);
      }
    })();
    return () => controller.abort();
  }, [backend, items]);
};
