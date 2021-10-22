import { History, LayersModel } from "@tensorflow/tfjs";
import { FitOptions } from "../../../types/FitOptions";
import * as tensorflow from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";

export const fit = async (
  compiled: LayersModel,
  data: {
    val: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor;
      ys: tensorflow.Tensor;
    }>;
    train: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor;
      ys: tensorflow.Tensor;
    }>;
  },
  options: FitOptions,
  onEpochEnd: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const compiledMetrics = compiled.metrics as Array<string>;
  const metrics = compiledMetrics.concat(
    compiledMetrics.map((metric: string) => {
      return "val_" + metric;
    }),
    "loss",
    "val_loss"
  );

  //Visualization
  // TODO eventually move this to the Architecture Settings component
  const container = document.getElementById("tfvis-container") as HTMLElement;
  tfvis.show.modelSummary(container, compiled);

  const args = {
    callbacks: [
      {
        onEpochEnd: onEpochEnd,
      },
      tfvis.show.fitCallbacks(container, metrics, {
        callbacks: ["onEpochEnd"],
      }),
    ],
    epochs: options.epochs,
    validationData: data.val.batch(options.batchSize),
  };

  const status = await compiled.fitDataset(
    data.train.batch(options.batchSize),
    args
  );

  return { fitted: compiled, status: status };
};
