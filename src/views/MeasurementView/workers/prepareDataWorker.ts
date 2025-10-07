import { setBackend, tensor4d } from "@tensorflow/tfjs";
import { expose } from "comlink";

import { prepareThingData } from "../utils";

import { ThingData } from "store/measurements/types";
import { DataArray } from "store/data/types";

await setBackend("cpu");

/**
 * Web Worker API exposed via Comlink that processes image/object data for measurements.
 * Receives a collection of "things" (images/objects), converts their raw data to tensors,
 * applies masks if present, and prepares channel data for measurement calculations.
 * Reports progress as a percentage during processing via callback.
 */

/**
 * Processes thing data and prepares it for measurements.
 * @param kind - The kind/type of things being processed
 * @param things - Array of thing data to process
 * @param onProgress - Optional callback to report processing progress (0-100)
 * @returns Object containing the kind and processed thing data
 */
async function processPrepareData(
  kind: string,
  things: {
    id: string;
    kind: string;
    data: number[][][][];
    encodedMask?: number[];
    decodedMask?: DataArray;
  }[],
  onProgress?: (progress: number) => void,
) {
  const thingInfo: ThingData = {};
  const thingCount = things.length;

  // Process each thing sequentially, preparing its data for measurements
  for (let i = 0; i < things.length; i++) {
    const thingData = things[i];
    const { id, data: rawData, encodedMask, decodedMask } = thingData;

    // Convert raw 4D array to TensorFlow tensor (planes, height, width, channels)
    const data = tensor4d(rawData);
    const preparedThing = await prepareThingData({
      data,
      encodedMask,
      decodedMask,
    });

    thingInfo[id] = preparedThing;

    // Report progress via callback if provided
    if (onProgress) {
      onProgress(Math.floor((i / thingCount) * 100));
    }
  }

  // Return final processed data
  return { kind, data: thingInfo };
}

const api = {
  processPrepareData,
};

expose(api);
