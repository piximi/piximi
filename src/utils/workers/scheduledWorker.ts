// src/workers/scheduler/worker.ts

import type {
  IScheduledWorkerAPI,
  TaskRegistry,
} from "utils/worker-scheduler/types";
import "./workerPolyfills"; // Must be first — polyfills `window` for zarr/imjoy-rpc

import * as Comlink from "comlink";

import { loadImage } from "utils/file-io-v2/file-loader/loadImage";
import { loadProject } from "utils/file-io-v2/project-loader/loadProject";

const taskRegistry: TaskRegistry = {
  loadImage: async (payload, ct, prog) => loadImage(payload, ct, prog),
  loadProject: async (payload, ct, prog) => loadProject(payload, ct, prog),
};
const scheduledWorkerAPI: IScheduledWorkerAPI = {
  async execute(type, payload, cancelToken, onProgress) {
    const handler = taskRegistry[type];
    if (!handler) throw new Error(`Unknown task type: ${type}`);
    return handler(payload, cancelToken, onProgress);
  },
};

Comlink.expose(scheduledWorkerAPI);
