import { useBackend } from "core/backend";

import { useKeyedAsync } from "./useKeyedAsync";

import type { Backend, RawChannelData } from "core/backend";
import type { ExtendedChannel } from "core/entities";

type ChannelData = Array<Pick<RawChannelData, "bitDepth" | "data">>;

const EMPTY: ChannelData = [];

const loadChannelData = async (
  backend: Backend,
  visibleChannels: ExtendedChannel[],
): Promise<ChannelData | undefined> => {
  // Only a backend holding the pixels locally serves them raw; otherwise the
  // viewer works from composites.
  if (!backend.render.raw) return undefined;
  const raw = await backend.render.raw(visibleChannels.map((c) => c.id));
  return raw.map(({ bitDepth, data }) => ({ bitDepth, data }));
};

/**
 * Returns the raw channel data for the visible channels.
 *
 * Keyed on the visible channels' ids only: ramp and colour map are applied by
 * the renderer, so contrast changes don't re-read the pixels.
 */
export function useRawImageData(channels: ExtendedChannel[]): {
  channelData: ChannelData;
  loading: boolean;
} {
  const backend = useBackend();
  const visibleChannels = channels.filter((c) => c.visible);
  const key =
    visibleChannels.length === 0
      ? null
      : visibleChannels.map((c) => c.id).join("|");

  const { latest, loading } = useKeyedAsync(key, () =>
    loadChannelData(backend, visibleChannels),
  );

  return {
    // no visible channels → empty; otherwise keep showing the last loaded
    // frame while a new key loads (matches today's no-blank behaviour)
    channelData: key === null ? EMPTY : (latest ?? EMPTY),
    loading,
  };
}
