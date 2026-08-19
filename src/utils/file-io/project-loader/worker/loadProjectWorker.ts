import "../../../workers/workerPolyfills";
import * as Comlink from "comlink";

import { loadProject } from "../loadProject";

Comlink.expose({ loadProject });
