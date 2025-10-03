import { tensor4d } from "@tensorflow/tfjs";

import { prepareThingData } from "../utils";

import { ThingData } from "store/measurements/types";
import { DataArray } from "store/data/types";

/**
 * Web Worker that processes image/object data for measurements.
 * Receives a collection of "things" (images/objects), converts their raw data to tensors,
 * applies masks if present, and prepares channel data for measurement calculations.
 * Reports progress as a percentage during processing.
 */
self.onmessage = async (
  e: MessageEvent<{
    kind: string;
    things: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[];
  }>,
) => {
  const thingInfo: ThingData = {};
  const thingCount = e.data.things.length;
  let i = 0;
  const perf_total = { transfer: 0, prepChan: 0, getMaskData: 0, dec: 0 };
  // Process each thing sequentially, preparing its data for measurements
  for await (const thingData of e.data.things) {
    const { id, data: rawData, encodedMask, decodedMask } = thingData;

    // Convert raw 4D array to TensorFlow tensor (planes, height, width, channels)
    const trans_t0 = performance.now();
    const data = tensor4d(rawData);
    const trans_tf = performance.now();
    const { thingInfo: preparedThing, perf } = await prepareThingData({
      data,
      encodedMask,
      decodedMask,
    });
    perf_total.prepChan += perf.prep;
    perf_total.getMaskData += perf.mask;
    perf_total.dec += perf.dec;
    perf_total.transfer += trans_tf - trans_t0;
    thingInfo[id] = preparedThing;
    // Report progress to main thread
    self.postMessage({ loadValue: Math.floor((i / thingCount) * 100) });
    i++;
  }
  console.log(perf_total);
  // Send final processed data back to main thread
  self.postMessage({ kind: e.data.kind, data: thingInfo });
};

export {};
