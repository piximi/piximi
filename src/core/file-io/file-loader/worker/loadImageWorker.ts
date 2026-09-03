import "utils/workers/workerPolyfills";
import * as Comlink from "comlink";

import { loadImage } from "../loadImage";

Comlink.expose({ loadImage });
