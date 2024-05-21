import * as tf from "@tensorflow/tfjs";
import { decode } from "utils/annotator";
import { DataArray } from "utils/file-io/types";
import { getObjectMaskData, prepareChannels } from "utils/measurements/helpers";

/* eslint-disable-next-line no-restricted-globals */
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
  }>
) => {
  const thingChannels: Record<string, number[][]> = {};
  for await (const thingData of e.data.things) {
    const data = tf.tensor4d(thingData.data);
    let channelData: tf.Tensor2D;
    if (thingData.decodedMask) {
      const fullChannelData = prepareChannels(data);
      channelData = await getObjectMaskData(
        fullChannelData,
        thingData.decodedMask
      );
      fullChannelData.dispose();
    } else if (thingData.encodedMask) {
      const decodedMask = Uint8Array.from(decode(thingData.encodedMask));
      const fullChannelData = prepareChannels(data);
      channelData = await getObjectMaskData(fullChannelData, decodedMask);
      fullChannelData.dispose();
    } else {
      channelData = prepareChannels(data);
    }
    thingChannels[thingData.id] = channelData.arraySync();
    channelData.dispose();
  }
  /* eslint-disable-next-line no-restricted-globals */
  self.postMessage({ kind: e.data.kind, channels: thingChannels });
};

export {};
