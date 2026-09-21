import * as Comlink from "comlink";
import "../../workers/workerPolyfills";

import { computeObjectIntensityMeasurements } from "../computeObjectIntensityMeasurements";

Comlink.expose(computeObjectIntensityMeasurements);
