// Vite-specific HMR teardown for the measurements workers. Pulled out of the
// production class so that the class itself is build-tool-agnostic.

import type { MeasurementsApi } from "./MeasurementsApi";

export const registerMeasurementsApiHmrCleanup = (
  api: MeasurementsApi,
): void => {
  if (!import.meta.hot) return;
  import.meta.hot.dispose(async () => {
    await api.destroy();
  });
};
