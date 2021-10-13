import { getModel } from "./networks";
import { CompileOptions } from "../../../types/CompileOptions";
import { LossFunction } from "../../../types/LossFunction";
import { Metric } from "../../../types/Metric";
import { OptimizationAlgorithm } from "../../../types/OptimizationAlgorithm";
import { compile } from "../../../store/coroutines/classifier/compile";
import { FitOptions } from "../../../types/FitOptions";
import * as tfvis from "@tensorflow/tfjs-vis";
import * as tensorflow from "@tensorflow/tfjs";
import { Tensor2D } from "@tensorflow/tfjs";
import { MnistData } from "../../../examples/mnist/data";

export const train_mnist = async () => {
  const mnistModel = getModel();

  const container = document.getElementById(
    "vis-train-container"
  ) as HTMLElement;
  tfvis.show.modelSummary(container, mnistModel);

  const mnistCompileOptions: CompileOptions = {
    learningRate: 0.001,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.BinaryAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  };

  const compiledMnistModel = compile(mnistModel, mnistCompileOptions);

  const mnistFitOptions: FitOptions = {
    batchSize: 512,
    epochs: 5,
    initialEpoch: 0,
    test_data_size: 1000, //TODO experiment with 10000
    train_data_size: 5500, //TODO experiment with 55000
    shuffle: true,
  };

  //TODO add callback options to Types and to Classifier project
  const metrics = ["loss", "val_loss", "acc", "val_acc"];
  const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);

  // Load project with data
  const data = new MnistData();
  await data.load();

  const [trainXs, trainYs] = tensorflow.tidy(() => {
    const d = data.nextTrainBatch(mnistFitOptions.train_data_size!);

    if (!d) return;

    return [
      d.xs.reshape([mnistFitOptions.train_data_size!, 28, 28, 1]),
      d.labels,
    ];
  }) as Array<Tensor2D>;

  const [testXs, testYs] = tensorflow.tidy(() => {
    const d = data.nextTestBatch(mnistFitOptions.test_data_size!);
    if (!d) return;
    return [
      d.xs.reshape([mnistFitOptions.test_data_size!, 28, 28, 1]),
      d.labels,
    ];
  }) as Array<Tensor2D>;

  console.info("fitting...");
  return await compiledMnistModel.fit(trainXs, trainYs, {
    batchSize: mnistFitOptions.batchSize!,
    validationData: [testXs, testYs],
    epochs: mnistFitOptions.epochs!,
    shuffle: true,
    callbacks: fitCallbacks,
  });
};
