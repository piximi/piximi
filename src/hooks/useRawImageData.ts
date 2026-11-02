import { DataConnector } from "core/data-connector";

import { useKeyedAsync } from "./useKeyedAsync";

import type { BitDepth, ExtendedChannel } from "core/entities";

type ChannelData = Array<{
  bitDepth: BitDepth;
  data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
}>;

const EMPTY: ChannelData = [];

const loadChannelData = async (
  visibleChannels: ExtendedChannel[],
): Promise<ChannelData | undefined> => {
  const result = await DataConnector.getInstance().retrieveBatch(
    visibleChannels.map((c) => ({
      id: c.storageReference.storageId,
      storeName: c.storageReference.storeName,
    })),
  );
  if (!result.success) return undefined;

  const { bitDepth } = result.data.get(
    visibleChannels[0].storageReference.storageId,
  )!;
  return [...result.data.values()].map((c) => ({
    bitDepth,
    data: bitDepth === 8 ? new Uint8Array(c.data) : new Uint16Array(c.data),
  }));
};

/**
 * Returns the raw channel data for the visible channels.
 *
 * Keyed on the visible channels' storage ids only: ramp and colour map are
 * applied by the renderer, so contrast changes don't re-read IndexedDB.
 */
export function useRawImageData(channels: ExtendedChannel[]): {
  channelData: Array<{
    bitDepth: BitDepth;
    data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
  }>;
  loading: boolean;
} {
  const visibleChannels = channels.filter((c) => c.visible);
  const key =
    visibleChannels.length === 0
      ? null
      : visibleChannels.map((c) => c.storageReference.storageId).join("|");

  const { latest, loading } = useKeyedAsync(key, () =>
    loadChannelData(visibleChannels),
  );

  return {
    // no visible channels → empty; otherwise keep showing the last loaded
    // frame while a new key loads (matches today's no-blank behaviour)
    channelData: key === null ? EMPTY : (latest ?? EMPTY),
    loading,
  };
}
