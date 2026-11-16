import { toChannelDisplay, useBackend } from "core/backend";

import {
  getCacheKey,
  getRenderedSrc,
  setRenderedSrc,
} from "utils/renderedSrcsCache";

import { useKeyedAsync } from "./useKeyedAsync";

import type { Backend } from "core/backend";
import type { BBox, ExtendedChannel } from "core/entities";

const renderToDataUrl = async (
  backend: Backend,
  channels: ExtendedChannel[],
  crop: BBox | undefined,
  key: string,
): Promise<string | undefined> => {
  const { dataUrl } = await backend.render.image({
    channels: channels.map(toChannelDisplay),
    region: crop,
  });
  setRenderedSrc(key, dataUrl);
  return dataUrl;
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
  const backend = useBackend();
  const anyVisible = channels.some((c) => c.visible);
  const key = anyVisible ? getCacheKey(channels, crop) : null;

  // "" is usePreloadSrcs' "worker in flight" placeholder — treat as a miss
  const cached = key ? getRenderedSrc(key) || undefined : undefined;

  const { latest, loading } = useKeyedAsync(cached ? null : key, () =>
    renderToDataUrl(backend, channels, crop, key!),
  );

  if (key === null) return { src: "", loading: false };
  return {
    src: cached || latest || "",
    loading: !cached && loading,
  };
}
