import * as tensorflow from "@tensorflow/tfjs";
import { CompileOptions } from "../../../types/CompileOptions";
import { LossFunction } from "../../../types/LossFunction";
import { OptimizationAlgorithm } from "../../../types/OptimizationAlgorithm";
import { Metric } from "../../../types/Metric";

export const compile = (
  opened: tensorflow.LayersModel,
  options: CompileOptions
) => {
  const compiled = opened;

  const loss = () => {
    switch (options.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return "absoluteDifference";
      }
      case LossFunction.CategoricalCrossEntropy: {
        return "categoricalCrossentropy";
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

  const metrics = () => {
    return options.metrics.map((metric: Metric) => {
      switch (metric) {
        case Metric.BinaryAccuracy:
          return "binaryAccuracy";
        case Metric.BinaryCrossEntropy:
          return "binaryCrossentropy";
        case Metric.CategoricalAccuracy:
          return "categoricalAccuracy";
        case Metric.CategoricalCrossEntropy:
          return "categoricalCrossentropy";
        case Metric.CosineProximity:
          return "categoricalCrossentropy";
        case Metric.MeanAbsoluteError:
          return "meanAbsoluteError";
        case Metric.MeanAbsolutePercentageError:
          return "meanAbsolutePercentageError";
        case Metric.MeanSquaredError:
          return "meanSquaredError";
        case Metric.Precision:
          return "precision";
        case Metric.Recall:
          return "recall";
        case Metric.SparseCategoricalAccuracy:
          return "sparseCategoricalAccuracy";
      }
    });
  };

  const optimizer = (): tensorflow.Optimizer => {
    switch (options.optimizationAlgorithm) {
      case OptimizationAlgorithm.Adadelta: {
        return tensorflow.train.adadelta(options.learningRate);
      }
      case OptimizationAlgorithm.Adagrad: {
        return tensorflow.train.adagrad(options.learningRate);
      }
      case OptimizationAlgorithm.Adam: {
        return tensorflow.train.adam(options.learningRate);
      }
      case OptimizationAlgorithm.Adamax: {
        return tensorflow.train.adamax(options.learningRate);
      }
      case OptimizationAlgorithm.RMSProp: {
        return tensorflow.train.rmsprop(options.learningRate);
      }
      case OptimizationAlgorithm.StochasticGradientDescent: {
        return tensorflow.train.sgd(options.learningRate);
      }
      default: {
        return tensorflow.train.sgd(options.learningRate);
      }
    }
  };

  compiled.compile({
    loss: loss(),
    metrics: metrics(),
    optimizer: optimizer(),
  });

  return compiled;
};
