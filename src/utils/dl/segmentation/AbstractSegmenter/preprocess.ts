import { Tensor4D, data as tfdata } from "@tensorflow/tfjs";
import { FitOptions, InferenceInput } from "../../types";
import { channelsToTensor } from "../../tensor-assembly";

export const preprocessInference = (
  items: Array<InferenceInput>,
  _fitOptions: FitOptions,
) => {
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
