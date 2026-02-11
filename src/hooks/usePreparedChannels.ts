import { useState, useEffect } from "react";
import {
  TensorStorageService,
  STORES,
  StoreName,
  PreparedChannelData,
} from "services/tensorStorage";
import { parseError } from "utils/errorUtils";

type UsePreparedChannelsResult = {
  channels: PreparedChannelData | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Hook to load prepared channel data from IndexedDB
 *
 * This returns the pre-computed channel data used for measurements,
 * without loading the full tensor.
 *
 * Usage:
 * ```typescript
 * const { channels, loading } = usePreparedChannels(imageId);
 *
 * if (channels) {
 *   / Access channels.data[channelIndex] for pixel values
 *   / Access channels.histograms[channelIndex] for histogram
 * }
 * ```
 */
export function usePreparedChannels(
  id: string | null,
  storeName: StoreName = STORES.IMAGE_TENSORS,
): UsePreparedChannelsResult {
  const [channels, setChannels] = useState<PreparedChannelData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!id) {
      setChannels(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadChannels = async () => {
      setLoading(true);
      setError(null);

      try {
        const storage = TensorStorageService.getInstance();
        const result = await storage.retrievePreparedChannels(id, storeName);

        if (!cancelled) {
          setChannels(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(parseError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChannels();

    return () => {
      cancelled = true;
    };
  }, [id, storeName]);

  return { channels, loading, error };
}
