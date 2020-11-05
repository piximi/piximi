import { History, LayersModel, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { FitOptions } from "../../../types/FitOptions";

export const fit = async (
  compiled: LayersModel,
  data: Dataset<{ xs: any; ys: any }>,
  validationData: Dataset<{ xs: any; ys: any }>,
  options: FitOptions,
  callback?: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const args = {
    callbacks: {
      onBatchEnd: callback,
    },
    epochs: options.epochs,
    validationData: validationData.batch(options.batchSize),
  };

  const status = await compiled.fitDataset(data.batch(options.batchSize), args);

  return { fitted: compiled, status: status };
};
