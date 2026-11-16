import { DataConnector } from "core/data-connector";

import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";
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

  const url = compositeChannelsToDataUrl(visibleChannels, result.data, crop);
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
