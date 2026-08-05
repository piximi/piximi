import * as Comlink from "comlink";
import "../../workers/workerPolyfills";

import { computeObjectFeatures } from "../computeObjectFeatures";

Comlink.expose(computeObjectFeatures);
