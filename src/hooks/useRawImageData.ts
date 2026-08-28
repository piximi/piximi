import { useEffect, useState } from "react";

import type { BitDepth, ExtendedChannel } from "store/data/types";

import { DataConnector } from "utils/data-connector";

/**
 * Returns the raw channel data for a given entity.
 *
 */
export function useRawImageData(channels: ExtendedChannel[]): {
  channelData: Array<{
    bitDepth: BitDepth;
    data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
  }>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [channelData, setChannelData] = useState<
    Array<{
      bitDepth: BitDepth;
      data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
    }>
  >([]);

  useEffect(() => {
    if (channels.length === 0) {
      setChannelData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const visibleChannels = channels.filter((c) => c.visible);
        if (visibleChannels.length === 0) {
          setChannelData([]);
          return;
        }
        const storage = DataConnector.getInstance();
        const result = await storage.retrieveBatch(
          visibleChannels.map((e) => ({
            id: e.storageReference.storageId,
            storeName: e.storageReference.storeName,
          })),
        );
        if (!cancelled && result.success) {
          const { bitDepth } = result.data.get(
            visibleChannels[0].storageReference.storageId,
          )!;

          const channelData = [...result.data.values()].map((c) => ({
            bitDepth,
            data:
              bitDepth === 8 ? new Uint8Array(c.data) : new Uint16Array(c.data),
          }));
          setChannelData(channelData);
        }
      } catch (error) {
        // Fall back to empty src
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [channels]);

  return { channelData, loading };
}
