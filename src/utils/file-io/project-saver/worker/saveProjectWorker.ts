import "../../../workers/workerPolyfills";
import * as Comlink from "comlink";

import { saveProject } from "../saveProject";

Comlink.expose({ saveProject });
