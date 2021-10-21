import { History, LayersModel } from "@tensorflow/tfjs";
import { FitOptions } from "../../../types/FitOptions";
import * as tensorflow from "@tensorflow/tfjs";

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
  const args = {
    callbacks: {
      onEpochEnd: onEpochEnd,
    },
    epochs: options.epochs,
    validationData: data.val,
  };

  // await data.batch(8).forEachAsync((e: any) => console.log(e))
  // const n = await data.batch(8).iterator()
  // console.info(await n.next());

  const status = await compiled.fitDataset(
    data.train.batch(options.batchSize),
    args
  ); //TODO replace with options.batchSize
  //TODO fitDataset() should be taking val_ata_size, train_data_size, shuffle args, as arguments

  return { fitted: compiled, status: status };
};
