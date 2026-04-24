import { tensor3d, Tensor3D } from "@tensorflow/tfjs";

import { DataConnector } from "utils/data-connector";

import type { BBox, ExtendedChannel, Shape } from "store/dataV2/types";

export async function channelsToTensor(
  channels: ExtendedChannel[],
  shape: Shape,
  region: BBox,
): Promise<Tensor3D> {
  const storage = DataConnector.getInstance();
  const result = await storage.retrieveBatch(
    channels.map((c) => ({
      id: c.storageReference.storageId,
      storeName: c.storageReference.storeName,
    })),
  );

  if (!result.success) {
    throw new Error(
      `channelsToTensor: failed to retrieve channel data: ${result.error.message}`,
      { cause: result.error },
    );
  }

  const [x0, y0, x1, y1] = region;
  const outW = x1 - x0;
  const outH = y1 - y0;
  const numChannels = channels.length;

  const typedViews = channels.map((c) => {
    const stored = result.data.get(c.storageReference.storageId)!;
    return stored.bitDepth === 8
      ? new Uint8Array(stored.data)
      : new Uint16Array(stored.data);
  });

  const interleaved = new Float32Array(outH * outW * numChannels);
  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const srcIdx = (y0 + row) * shape.width + (x0 + col);
      const dstBase = (row * outW + col) * numChannels;
      for (let ch = 0; ch < numChannels; ch++) {
        interleaved[dstBase + ch] = typedViews[ch][srcIdx];
      }
    }
  }

  return tensor3d(interleaved, [outH, outW, numChannels]);
}
