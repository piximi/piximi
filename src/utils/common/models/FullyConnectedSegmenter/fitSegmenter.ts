import { History, LayersModel, data, Tensor } from "@tensorflow/tfjs";
import { FitOptions } from "types";

export const fitSegmenter = async (
  compiled: LayersModel,
  data: {
    val: data.Dataset<{
      xs: Tensor;
      ys: Tensor;
    }>;
    train: data.Dataset<{
      xs: Tensor;
      ys: Tensor;
    }>;
  },
  options: FitOptions,
  onEpochEnd: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const args = {
    // callbacks: [
    //   {
    //     onEpochEnd: onEpochEnd,
    //   },
    // ],
    epochs: options.epochs,
    validationData: data.val,
  };

  const status = await compiled.fitDataset(data.train, args);

  return { fitted: compiled, status: status };
};
