import { useEffect, useMemo } from "react";

import { toChannelDisplay, useBackend } from "core/backend";

import {
  deleteRenderedSrc,
  getCacheKey,
  getRenderedSrc,
  setRenderedSrc,
} from "utils/renderedSrcsCache";

import type { BBox, ExtendedChannel } from "core/entities";

export type PreloadItem = {
  channelsRef: ExtendedChannel[];
  boundingBox?: BBox;
};

/*
 * Warms the rendered-src cache for the grid items in view, in the order
 * given. The backend completes earlier requests first; when the set of
 * items changes, the rest is dropped and anything still pending is released
 * so that a cell can render it itself. Items are compared by what they
 * would render, so a list rebuilt with the same contents starts nothing new.
 */
export const usePreloadSrcs = (items: PreloadItem[]) => {
  const backend = useBackend();
  const keyed = useMemo(
    () =>
      items.map((item) => ({
        key: getCacheKey(item.channelsRef, item.boundingBox),
        item,
      })),
    [items],
  );
  const signature = useMemo(
    () => keyed.map(({ key }) => key).join("\n"),
    [keyed],
  );

  useEffect(() => {
    if (signature === "") return;
    // Claiming the keys at once keeps `useRenderedSrc` from rendering the
    // same thumbnails in parallel.
    const pending = keyed.filter(
      ({ key }) => getRenderedSrc(key) === undefined,
    );
    if (pending.length === 0) return;
    for (const { key } of pending) setRenderedSrc(key, "");

    const controller = new AbortController();
    const done = new Set<string>();
    void (async () => {
      const results = backend.render.thumbnails(
        pending.map(({ item }) => ({
          channels: item.channelsRef.map(toChannelDisplay),
          region: item.boundingBox,
        })),
        { signal: controller.signal },
      );
      for await (const result of results) {
        const { key } = pending[result.index];
        done.add(key);
        if (result.ok) setRenderedSrc(key, result.image.dataUrl);
        else deleteRenderedSrc(key);
      }
    })();
    return () => {
      controller.abort();
      for (const { key } of pending) {
        if (!done.has(key) && getRenderedSrc(key) === "")
          deleteRenderedSrc(key);
      }
    };
    // `keyed` is what `signature` summarises; a rebuilt list with the same
    // contents must not start over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, signature]);
};
