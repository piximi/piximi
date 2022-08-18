import { History, LayersModel, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { FitOptions } from "../../../types/FitOptions";

export const fitClassifier = async (
  compiled: LayersModel,
  data: {
    val: Dataset<{
      xs: Tensor;
      ys: Tensor;
    }>;
    train: Dataset<{
      xs: Tensor;
      ys: Tensor;
    }>;
  },
  options: FitOptions,
  onEpochEnd: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const args = {
    callbacks: [
      {
        onEpochEnd: onEpochEnd,
      },
    ],
    epochs: options.epochs,
    validationData: data.val,
  };

  const status = await compiled.fitDataset(data.train, args);

  return { fitted: compiled, status: status };
};
