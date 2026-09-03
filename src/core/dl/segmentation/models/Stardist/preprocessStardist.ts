import { data as tfdata, scalar, tidy } from "@tensorflow/tfjs";

import type { LoadCB } from "utils/types";

import { padToMatch } from "../../../utils";
import { channelsToTensor } from "../../../tensor-assembly";

import type { Tensor3D, Tensor4D } from "@tensorflow/tfjs";
import type { InferenceInput } from "../../../types";

const padImage = (image: Tensor3D, padX: number, padY: number): Tensor3D => {
  if (padX === 0 && padY === 0) {
    return image;
  }

  return tidy(() =>
    padToMatch(
      image,
      {
        height: image.shape[0] + padY,
        width: image.shape[1] + padX,
      },
      "reflect",
    ),
  );
};

export const preprocessStardist = (
  items: Array<InferenceInput>,
  batchSize: number,
  dataDims: Array<{ padX: number; padY: number }>,
  loadCB: LoadCB,
) => {
  const count = items.length;
  const indices = tfdata.generator(function* () {
    for (let i = 0; i < count; i++) yield i;
  });
  let i = 1;
  return indices
    .mapAsync(async (value) => {
      loadCB(Math.round((i / items.length) * 100), "1/2 Preprocessing images");
      const index = value as number;
      const item = items[index];
      const xs = await channelsToTensor(
        item.channelsRef,
        item.shape,
        item.region,
      );
      const bitDepth = item.channelsRef[0].bitDepth;
      const normalized = tidy(
        () => xs.div(scalar(2 ** bitDepth - 1)) as Tensor3D,
      );
      xs.dispose();
      i++;
      return padImage(normalized, dataDims[index].padX, dataDims[index].padY);
    })
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};
