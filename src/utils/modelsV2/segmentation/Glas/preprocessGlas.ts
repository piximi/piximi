import {
  Tensor3D,
  Tensor4D,
  data as tfdata,
  scalar,
  tidy,
} from "@tensorflow/tfjs";
import { channelsToTensor } from "../../tensor-assembly";
import { InferenceInput } from "../../types";

export const preprocessGlas = (
  items: Array<InferenceInput>,
  batchSize: number,
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
      const bitDepth = item.channelsRef[0].bitDepth;
      const resized = tidy(
        () =>
          xs
            .div(scalar(2 ** bitDepth - 1))
            .resizeBilinear([768, 768]) as Tensor3D,
      );
      xs.dispose();
      return resized;
    })
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};
