import { History, LayersModel } from "@tensorflow/tfjs";
import { FitOptions } from "../../../types/FitOptions";
import * as tensorflow from "@tensorflow/tfjs";

export const fit = async (
  compiled: LayersModel,
  data: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>,
  options: FitOptions,
  onEpochEnd: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const args = {
    callbacks: {
      onEpochEnd: onEpochEnd,
    },
    epochs: options.epochs,
  };

  const status = await compiled.fitDataset(data.batch(options.batchSize), args);

  return { fitted: compiled, status: status };
};
