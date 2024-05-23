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
  const thingInfo: Record<
    string,
    {
      channels: number[][];
      maskData?: DataArray;
      maskShape?: { width: number; height: number };
    }
  > = {};
  for await (const thingData of e.data.things) {
    const data = tf.tensor4d(thingData.data);
    let channelData: tf.Tensor2D;
    let maskData: DataArray | undefined = undefined;
    let maskShape: { width: number; height: number } | undefined;
    if (thingData.decodedMask) {
      const fullChannelData = prepareChannels(data);
      channelData = await getObjectMaskData(
        fullChannelData,
        thingData.decodedMask
      );
      fullChannelData.dispose();
      maskData = thingData.decodedMask;
      maskShape = {
        height: thingData.data[0].length,
        width: thingData.data[0][0].length,
      };
    } else if (thingData.encodedMask) {
      const decodedMask = Uint8Array.from(decode(thingData.encodedMask));
      const fullChannelData = prepareChannels(data);
      channelData = await getObjectMaskData(fullChannelData, decodedMask);
      fullChannelData.dispose();
      maskData = decodedMask;
      maskShape = {
        height: thingData.data[0].length,
        width: thingData.data[0][0].length,
      };
    } else {
      channelData = prepareChannels(data);
    }
    thingInfo[thingData.id] = {
      channels: channelData.arraySync(),
      maskData,
      maskShape,
    };
    channelData.dispose();
  }
  /* eslint-disable-next-line no-restricted-globals */
  self.postMessage({ kind: e.data.kind, data: thingInfo });
};

export {};
