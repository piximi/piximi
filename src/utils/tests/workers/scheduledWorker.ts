// src/workers/scheduler/worker.ts

import type {
  IScheduledWorkerAPI,
  TaskRegistry,
} from "utils/worker-scheduler/types";
import "./workerPolyfills"; // Must be first — polyfills `window` for zarr/imjoy-rpc

import * as Comlink from "comlink";

const taskRegistry: TaskRegistry = {
  any: async (_payload, _ct, _prog) => "result",
};
const scheduledWorkerAPI: IScheduledWorkerAPI = {
  async execute(type, payload, cancelToken, onProgress) {
    const handler = taskRegistry[type];
    if (!handler) throw new Error(`Unknown task type: ${type}`);
    return handler(payload, cancelToken, onProgress);
  },
};

Comlink.expose(scheduledWorkerAPI);
