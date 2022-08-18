import { LayersModel, Optimizer, train, losses } from "@tensorflow/tfjs";
import { CompileOptions } from "../../../types/CompileOptions";
import { LossFunction } from "../../../types/LossFunction";
import { OptimizationAlgorithm } from "../../../types/OptimizationAlgorithm";
import { Metric } from "../../../types/Metric";

export const compile = (opened: LayersModel, options: CompileOptions) => {
  const compiled = opened;

  const loss = (): any => {
    switch (options.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return losses.absoluteDifference;
      }
      case LossFunction.CategoricalCrossEntropy: {
        // 'categoricalCrossentropy' is the string name for 'losses.softmaxCrossEntropy'
        return losses.softmaxCrossEntropy;
      }
      case LossFunction.CosineDistance: {
        return losses.cosineDistance;
      }
      case LossFunction.Hinge: {
        return losses.hingeLoss;
      }
      case LossFunction.Huber: {
        return losses.huberLoss;
      }
      case LossFunction.Log: {
        return losses.logLoss;
      }
      case LossFunction.MeanSquaredError: {
        return losses.meanSquaredError;
      }
      case LossFunction.SigmoidCrossEntropy: {
        return losses.sigmoidCrossEntropy;
      }
      default: {
        return losses.softmaxCrossEntropy;
      }
    }
  };

  const metrics = () => {
    // eslint-disable-next-line array-callback-return
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

  const optimizer = (): Optimizer => {
    switch (options.optimizationAlgorithm) {
      case OptimizationAlgorithm.Adadelta: {
        return train.adadelta(options.learningRate);
      }
      case OptimizationAlgorithm.Adagrad: {
        return train.adagrad(options.learningRate);
      }
      case OptimizationAlgorithm.Adam: {
        return train.adam(options.learningRate);
      }
      case OptimizationAlgorithm.Adamax: {
        return train.adamax(options.learningRate);
      }
      case OptimizationAlgorithm.RMSProp: {
        return train.rmsprop(options.learningRate);
      }
      case OptimizationAlgorithm.StochasticGradientDescent: {
        return train.sgd(options.learningRate);
      }
      default: {
        return train.sgd(options.learningRate);
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
