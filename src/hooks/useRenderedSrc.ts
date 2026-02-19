import { useEffect, useState } from "react";

import { TensorStorageService } from "services/tensorStorage";
import { TensorReference } from "services/tensorStorage/types";

type EntityWithOptionalRef = {
  id: string;
  src: string;
  tensorRef?: TensorReference;
};

/**
 * Returns the rendered preview src for an entity.
 *
 * - Legacy path: returns entity.src directly
 * - New pipeline: loads renderedSrc from IndexedDB StoredTensorData
 */
export function useRenderedSrc(
  entity: EntityWithOptionalRef | null | undefined,
): { src: string; loading: boolean } {
  const [indexedDBSrc, setIndexedDBSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const tensorRef = entity?.tensorRef;
  const entityId = entity?.id;

  useEffect(() => {
    if (!tensorRef || !entityId) {
      setIndexedDBSrc("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const storage = TensorStorageService.getInstance();
        const result = await storage.retrieve(
          tensorRef.storageId,
          tensorRef.storeName,
        );
        if (!cancelled && result.success && result.data.renderedSrc) {
          setIndexedDBSrc(result.data.renderedSrc);
        }
      } catch {
        // Fall back to empty src
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [entityId, tensorRef?.storageId]);

  // Legacy path
  if (!tensorRef && entity) {
    return { src: entity.src, loading: false };
  }

  return { src: indexedDBSrc, loading };
}
