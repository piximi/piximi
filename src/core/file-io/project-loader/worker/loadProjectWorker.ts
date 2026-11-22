import "utils/workers/workerPolyfills";
import * as Comlink from "comlink";

import { loadProject } from "../loadProject";
import { upgradeProject } from "../upgradeProject";

Comlink.expose({ loadProject, upgradeProject });
