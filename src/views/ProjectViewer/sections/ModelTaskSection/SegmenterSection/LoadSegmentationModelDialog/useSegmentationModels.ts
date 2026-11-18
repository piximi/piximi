import { useCallback, useEffect, useState } from "react";

import { useBackend } from "core/backend";

import type { SegmentationModelDescriptor } from "core/backend";

/*
 * The backend's segmentation models, kept current: a plugin registered from a
 * notebook, or an environment that finished building, arrives as a
 * `models/didChange` event with the whole list. Only models that segment are
 * returned; a backend may list models for other tasks too.
 */
export const useSegmentationModels = (enabled: boolean) => {
  const backend = useBackend();
  const [models, setModels] = useState<SegmentationModelDescriptor[]>([]);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    const { segmentation } = backend;
    if (!segmentation) return;
    try {
      setModels(await segmentation.listModels());
      setError(undefined);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, [backend]);

  useEffect(() => {
    if (!enabled) return;
    const { segmentation } = backend;
    if (!segmentation) return;
    let stale = false;
    segmentation
      .listModels()
      .then((listed) => {
        if (stale) return;
        setModels(listed);
        setError(undefined);
      })
      .catch((cause) => {
        if (!stale) setError((cause as Error).message);
      });
    const unsubscribe = backend.subscribe((event) => {
      if (event.type === "models/didChange") setModels(event.models);
    });
    return () => {
      stale = true;
      unsubscribe();
    };
  }, [backend, enabled]);

  return {
    models: models.filter((model) => model.tasks.includes("segmentation")),
    error,
    refresh,
  };
};
