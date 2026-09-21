import * as Comlink from "comlink";

import { registerMeasurementsApiHmrCleanup } from "./devHmrCleanup";

import type { computeObjectFeatures } from "../computeObjectFeatures";
import type { computeObjectIntensityMeasurements } from "../computeObjectIntensityMeasurements";

class MeasurementsApi {
  private static instance: MeasurementsApi | undefined;
  private featuresWorker: Worker;
  private intensityWorker: Worker;
  private featuresBackend: Comlink.Remote<typeof computeObjectFeatures>;
  private intensityBackend: Comlink.Remote<
    typeof computeObjectIntensityMeasurements
  >;

  private constructor() {
    this.featuresWorker = new Worker(
      new URL("./objectMeasurementWorker.ts", import.meta.url),
      { type: "module" },
    );
    this.intensityWorker = new Worker(
      new URL("./objectIntensityMeasurementWorker.ts", import.meta.url),
      { type: "module" },
    );
    this.featuresWorker.onerror = (e) => {
      console.error("[MeasurementsApi] features worker error:", e.message, e);
    };
    this.intensityWorker.onerror = (e) => {
      console.error("[MeasurementsApi] intensity worker error:", e.message, e);
    };

    this.featuresBackend = Comlink.wrap(this.featuresWorker);
    this.intensityBackend = Comlink.wrap(this.intensityWorker);
    registerMeasurementsApiHmrCleanup(this);
  }

  // ===========================================================================
  // PUBLIC API: BEGIN
  // ===========================================================================

  /**
   * Get singleton instance
   */
  static getInstance(): MeasurementsApi {
    if (!MeasurementsApi.instance) {
      MeasurementsApi.instance = new MeasurementsApi();
    }
    return MeasurementsApi.instance;
  }

  computeFeatures(objects: Parameters<typeof computeObjectFeatures>[0]) {
    return this.featuresBackend(objects);
  }

  computeIntensityMeasurements(
    data: Parameters<typeof computeObjectIntensityMeasurements>[0],
  ) {
    return this.intensityBackend(data);
  }

  async destroy() {
    this.featuresBackend[Comlink.releaseProxy]?.();
    this.intensityBackend[Comlink.releaseProxy]?.();
    this.featuresWorker.terminate();
    this.intensityWorker.terminate();
    if (MeasurementsApi.instance === this) {
      MeasurementsApi.instance = undefined;
    }
  }
}

export { MeasurementsApi };
