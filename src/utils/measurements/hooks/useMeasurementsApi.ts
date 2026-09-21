import { useMemo } from "react";

import { MeasurementsApi } from "../workers/MeasurementsApi";

/**
 * Returns the shared measurements worker API (feature + intensity
 * computation). The instance is a lazily-created, persistent singleton —
 * this hook just gives consumers a stable handle to it.
 */
export const useMeasurementsApi = () =>
  useMemo(() => MeasurementsApi.getInstance(), []);
