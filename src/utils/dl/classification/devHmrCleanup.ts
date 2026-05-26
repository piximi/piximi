// src/utils/dl/classification/devHmrCleanup.ts
//
// Vite-specific HMR teardown for the classifier worker. Pulled out of the
// production class so that the class itself is build-tool-agnostic.

import type { IClassifierApi } from "./types";

export function registerClassifierHmrCleanup(api: IClassifierApi): void {
  if (!import.meta.hot) return;
  import.meta.hot.dispose(async () => {
    await api.destroy();
  });
}
