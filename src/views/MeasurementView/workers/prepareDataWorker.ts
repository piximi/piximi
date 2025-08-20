import { tensor4d } from "@tensorflow/tfjs";

import { prepareThingData } from "../utils";

import { ThingData } from "store/measurements/types";
import { DataArray } from "store/data/types";
import { expose } from "comlink";

const workerAPI = {
  async prepare(
    kind: string,
    things: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[],
    onProgress: (value: number) => void
  ): Promise<{ kind: string; data: ThingData }> {
    const thingInfo: ThingData = {};
    const thingCount = things.length;
    let i = 0;
    for await (const thingData of things) {
      const { id, data: rawData, encodedMask, decodedMask } = thingData;

      const data = tensor4d(rawData);
      const preparedThing = await prepareThingData({
        data,
        encodedMask,
        decodedMask,
      });
      thingInfo[id] = preparedThing;
      onProgress(Math.floor((i / thingCount) * 100));

      i++;
    }
    return { kind, data: thingInfo };
  },
};

expose(workerAPI);
