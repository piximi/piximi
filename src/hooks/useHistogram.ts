import { useEffect, useState } from "react";

import type { ExtendedChannel } from "store/data/types";
import { DataConnector } from "core/data-connector";

/**
 * Returns the rendered preview src for an entity.
 *
 * - Legacy path: returns entity.src directly
 * - New pipeline: loads renderedSrc from IndexedDB StoredTensorData
 */
export function useHistogram(
  channel: ExtendedChannel,
): { histogram: ArrayBuffer; numPixels: number } | undefined {
  const [channelHistogram, setChannelHistogram] = useState<
    { histogram: ArrayBuffer; numPixels: number } | undefined
  >();

  useEffect(() => {
    const load = async (channel: ExtendedChannel) => {
      const storage = DataConnector.getInstance();

      const result = await storage.retrieve(
        channel.id,
        channel.storageReference.storeName,
      );
      if (result.success) {
        const { histogram, width, height } = result.data;
        setChannelHistogram({ histogram, numPixels: width * height });
      }
    };
    load(channel);
  }, [channel.id]);

  return channelHistogram;
}
