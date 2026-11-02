import { useEffect, useState } from "react";

import { DataConnector } from "core/data-connector";

import type { ExtendedChannel } from "core/entities";

/**
 * Returns the channels histogram data and number fo pixels

 */
export function useHistogram(
  channel: ExtendedChannel,
): { histogram: ArrayBuffer; numPixels: number } | undefined {
  const [channelHistogram, setChannelHistogram] = useState<
    { histogram: ArrayBuffer; numPixels: number } | undefined
  >();

  const id = channel.id;
  const storeName = channel.storageReference.storeName;

  useEffect(() => {
    let cancelled = false;
    DataConnector.getInstance()
      .retrieve(id, storeName)
      .then((result) => {
        if (cancelled || !result.success) return;
        const { histogram, width, height } = result.data;
        setChannelHistogram({ histogram, numPixels: width * height });
      });
    return () => {
      cancelled = true;
    };
  }, [id, storeName]);

  return channelHistogram;
}
