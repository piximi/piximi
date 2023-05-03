// TODO -segmenter: Remove this, done in Concrete model class, e.g. `SimpleCNN`
import { History, LayersModel, Tensor2D, Tensor4D } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { FitOptions } from "../../../types/FitOptions";

export const fitClassifier = async (
  compiled: LayersModel,
  data: {
    val: Dataset<{
      xs: Tensor4D;
      ys: Tensor2D;
    }>;
    train: Dataset<{
      xs: Tensor4D;
      ys: Tensor2D;
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
