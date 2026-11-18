import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { toChannelDisplay, useBackend } from "core/backend";

import {
  deleteRenderedSrc,
  getCacheKey,
  getRenderedSrc,
  setRenderedSrc,
  subscribeRenderedSrc,
} from "utils/renderedSrcsCache";

import type { BBox, ExtendedChannel } from "core/entities";

const noop = () => {};
const MAX_ATTEMPTS = 2;

/**
 * Returns the rendered preview src for an entity.
 *
 * Keyed on getCacheKey (storage ids + ramp + colour map + visibility + crop):
 * the colours are baked into the PNG, so any of those changing re-renders.
 * Cache hits are read during render so they paint on the first commit. On a
 * miss the cell waits a tick before rendering for itself: a grid's preload
 * (`usePreloadSrcs`, an effect of the parent, so it runs after the cells')
 * claims the keys in view with `""`, and a claimed key is delivered through
 * the cache subscription instead.
 */
export function useRenderedSrc(
  channels: ExtendedChannel[],
  crop?: BBox,
): {
  src: string;
  loading: boolean;
} {
  const backend = useBackend();
  const anyVisible = channels.some((c) => c.visible);
  const key = anyVisible ? getCacheKey(channels, crop) : null;

  const subscribe = useCallback(
    (listener: () => void) =>
      key === null ? noop : subscribeRenderedSrc(key, listener),
    [key],
  );
  const cached = useSyncExternalStore(subscribe, () =>
    key === null ? undefined : getRenderedSrc(key),
  );

  const attempts = useRef({ key, count: 0 });
  const miss = key !== null && cached === undefined;
  useEffect(() => {
    if (!miss) return;
    if (attempts.current.key !== key) attempts.current = { key, count: 0 };
    if (attempts.current.count >= MAX_ATTEMPTS) return;
    const timer = setTimeout(() => {
      if (getRenderedSrc(key) !== undefined) return; // claimed meanwhile
      attempts.current.count++;
      setRenderedSrc(key, "");
      backend.render
        .image({ channels: channels.map(toChannelDisplay), region: crop })
        .then(
          ({ dataUrl }) => setRenderedSrc(key, dataUrl),
          (error: unknown) => {
            console.error(error);
            deleteRenderedSrc(key);
          },
        );
    }, 0);
    return () => clearTimeout(timer);
    // The channels and crop are what the key is made of.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, key, miss]);

  if (key === null) return { src: "", loading: false };
  return { src: cached || "", loading: !cached };
}
