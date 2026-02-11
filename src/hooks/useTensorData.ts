import { useState, useEffect, useCallback } from "react";
import { Tensor4D } from "@tensorflow/tfjs";
import {
  TensorStorageService,
  STORES,
  StoreName,
} from "services/tensorStorage";
import { parseError } from "utils/errorUtils";

type UseTensorDataResult = {
  tensor: Tensor4D | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

/**
 * Hook to load tensor data from IndexedDB
 *
 * IMPORTANT: The returned tensor must be disposed when no longer needed!
 * The hook will dispose the previous tensor when the id changes or on unmount.
 *
 * Usage:
 * ```typescript
 * const { tensor, loading, error } = useTensorData(imageId, STORES.IMAGE_TENSORS);
 *
 * useEffect(() => {
 *   if (tensor) {
 *     // Use tensor...
 *   }
 * }, [tensor]);
 * ```
 */
export function useTensorData(
  id: string | null,
  storeName: StoreName = STORES.IMAGE_TENSORS,
): UseTensorDataResult {
  const [tensor, setTensor] = useState<Tensor4D | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!id) {
      setTensor(null);
      setLoading(false);
      setError(null);
      return;
    }

    let disposed = false;
    let loadedTensor: Tensor4D | null = null;

    const loadTensor = async () => {
      setLoading(true);
      setError(null);

      try {
        const storage = TensorStorageService.getInstance();
        const result = await storage.retrieveAsTensor(id, storeName);

        if (disposed) {
          // Componenet unmounted or id changed while loading
          result?.dispose();
          return;
        }

        loadedTensor = result;
        setTensor(result);
      } catch (err) {
        if (!disposed) {
          setError(parseError(err));
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    loadTensor();

    return () => {
      disposed = true;
      // Dispose the tensor when id changes or component unmounts
      if (loadedTensor) {
        loadedTensor.dispose();
      }
    };
  }, [id, storeName, reloadTrigger]);

  return { tensor, loading, error, reload };
}

/**
 * Preload multiple tensors into cache
 * Call this before navigating to a view that needs multiple tensors
 */
export function usePreloadTensors(
  ids: string[],
  storeName: StoreName = STORES.IMAGE_TENSORS,
): { preloading: boolean; preloadError: Error | null } {
  const [preloading, setPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<Error | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;

    const preload = async () => {
      setPreloading(true);
      setPreloadError(null);

      try {
        const storage = TensorStorageService.getInstance();
        await storage.preload(ids, storeName);
      } catch (err) {
        setPreloadError(parseError(err));
      } finally {
        setPreloading(false);
      }
    };
    preload();
  }, [ids.join(","), storeName]);

  return { preloading, preloadError };
}
