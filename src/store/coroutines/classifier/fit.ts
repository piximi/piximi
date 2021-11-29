import { History, LayersModel } from "@tensorflow/tfjs";
import { FitOptions } from "../../../types/FitOptions";
import * as tensorflow from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";

/*
 * Fix for issue #90.
 * TL;DR: Preact pollutes the global namespace, and now we have to too.
 *
 * An unfortunately dirty solution to a nasty mix of using react alongside tfjs-vis, which in turn uses preact.
 * Preact v8 populates the global namespace with an extension of the Element type.
 * React also has an Element type, which it extends as ReactElement.
 * The two do no mix well, and cause all sorts of weird type issues whenever tfjs-vis is imported.
 * tfjs is not maintained so have not updated to v10+, and is also not likely to accept any pull requests.
 * Hence the messy solution below.
 *
 * See: https://github.com/preactjs/preact/issues/2748
 * Or see: line 129 of "node_modules/preact/src/preact.d.ts"
 */
declare global {
  namespace React {
    interface ReactElement {
      nodeName: any;
      attributes: any;
      children: any;
    }
  }
}

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
