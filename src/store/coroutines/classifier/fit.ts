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

  // await data.batch(8).forEachAsync((e: any) => console.log(e))
  // const n = await data.batch(8).iterator()
  // console.info(await n.next());
  // debugger;

  const status = await compiled.fitDataset(data.batch(8), args); //TODO replace 8 by options.batchSize

  return { fitted: compiled, status: status };
};
