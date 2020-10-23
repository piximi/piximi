import * as tensorflow from "@tensorflow/tfjs";
import { LossFunction, OptimizationAlgorithm } from "../../store";

type CompileSettings = {
  learningRate: number;
  lossFunction: string;
  optimizationAlgorithm: string;
};

export const compile = (
  opened: tensorflow.LayersModel,
  settings: CompileSettings
) => {
  const graph = opened;

  const loss = (): string => {
    switch (settings.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return "absoluteDifference";
      }
      case LossFunction.SoftmaxCrossEntropy: {
        return "softmaxCrossEntropy";
      }
      case LossFunction.CosineDistance: {
        return "cosineDistance";
      }
      case LossFunction.Hinge: {
        return "hingeLoss";
      }
      case LossFunction.Huber: {
        return "huberLoss";
      }
      case LossFunction.Log: {
        return "logLoss";
      }
      case LossFunction.MeanSquaredError: {
        return "meanSquaredError";
      }
      case LossFunction.SigmoidCrossEntropy: {
        return "sigmoidCrossEntropy";
      }
      default: {
        return "softmaxCrossEntropy";
      }
    }
  };

  const optimizer = (): tensorflow.Optimizer => {
    switch (settings.optimizationAlgorithm) {
      case OptimizationAlgorithm.Adadelta: {
        return tensorflow.train.adadelta(settings.learningRate);
      }
      case OptimizationAlgorithm.Adagrad: {
        return tensorflow.train.adagrad(settings.learningRate);
      }
      case OptimizationAlgorithm.Adam: {
        return tensorflow.train.adam(settings.learningRate);
      }
      case OptimizationAlgorithm.Adamax: {
        return tensorflow.train.adamax(settings.learningRate);
      }
      case OptimizationAlgorithm.Momentum: {
        return tensorflow.train.adamax(settings.learningRate);
      }
      case OptimizationAlgorithm.RMSProp: {
        return tensorflow.train.rmsprop(settings.learningRate);
      }
      case OptimizationAlgorithm.StochasticGradientDescent: {
        return tensorflow.train.sgd(settings.learningRate);
      }
      default: {
        return tensorflow.train.sgd(settings.learningRate);
      }
    }
  };

  const args = {
    loss: loss(),
    optimizer: optimizer(),
  };

  graph.compile(args);

  return graph;
};
