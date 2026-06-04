import { data as tfdata } from "@tensorflow/tfjs";

import { channelsToTensor } from "../../tensor-assembly";

import type { Tensor4D } from "@tensorflow/tfjs";
import type { InferenceInput } from "../../types";

export const preprocessInference = (items: Array<InferenceInput>) => {
  const count = items.length;
  const indices = tfdata.generator(function* () {
    for (let i = 0; i < count; i++) yield i;
  });

  return indices
    .mapAsync(async (value) => {
      const item = items[value as number];
      const xs = await channelsToTensor(
        item.channelsRef,
        item.shape,
        item.region,
      );
      const cast = xs.asType("int32");
      xs.dispose();
      return cast;
    })
    .batch(1) as tfdata.Dataset<Tensor4D>;
};
