import { useEffect, useState } from "react";

import { useBackend } from "core/backend";

import type { ModelDescriptor } from "core/backend";

/*
 * The architectures a classifier can be built from, kept current: a plugin
 * registered on the engine, or an environment that finished building,
 * arrives as a `models/didChange` event.
 */
export const useClassifierArchitectures = (): ModelDescriptor[] => {
  const backend = useBackend();
  const [architectures, setArchitectures] = useState<ModelDescriptor[]>([]);

  useEffect(() => {
    const { classification } = backend;
    if (!classification) return;
    let stale = false;
    const refresh = () =>
      classification
        .listArchitectures()
        .then((listed) => {
          if (!stale) setArchitectures(listed);
        })
        .catch((error: unknown) =>
          console.error("[useClassifierArchitectures]", error),
        );
    void refresh();
    const unsubscribe = backend.subscribe((event) => {
      if (event.type === "models/didChange") void refresh();
    });
    return () => {
      stale = true;
      unsubscribe();
    };
  }, [backend]);

  return architectures.filter((model) =>
    model.tasks.includes("classification.train"),
  );
};
