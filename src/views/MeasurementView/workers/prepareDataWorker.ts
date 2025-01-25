import * as tf from "@tensorflow/tfjs";

import { prepareThingData } from "../utils";

import { ThingData } from "store/measurements/types";
import { DataArray } from "utils/file-io/types";

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
  for await (const thingData of e.data.things) {
    const { id, data: rawData, encodedMask, decodedMask } = thingData;

    const data = tf.tensor4d(rawData);
    const preparedThing = await prepareThingData({
      data,
      encodedMask,
      decodedMask,
    });
    thingInfo[id] = preparedThing;
    self.postMessage({ loadValue: Math.floor((i / thingCount) * 100) });
    i++;
  }
  self.postMessage({ kind: e.data.kind, data: thingInfo });
};

export {};
