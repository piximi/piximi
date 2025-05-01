import { ModelCompileArgs, train, losses } from "@tensorflow/tfjs";

import { Tensor3D } from "@tensorflow/tfjs";
import { random } from "lodash";
import { LayersModel } from "@tensorflow/tfjs";
import { OptimizerSettings, ModelLayerData } from "./types";
import { LossFunction, Metric, OptimizationAlgorithm } from "./enums";
import { ShapeArray } from "store/data/types";
import { Shape } from "store/data/types";

export const createCompileArgs = (options: OptimizerSettings) => {
  const loss = (): ModelCompileArgs["loss"] => {
    switch (options.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return losses.absoluteDifference;
      }
      case LossFunction.CategoricalCrossEntropy: {
        // 'categoricalCrossentropy' is the string name for 'losses.softmaxCrossEntropy'
        return losses.softmaxCrossEntropy;
      }
      /*
       * Disabling CosineDistance, as it doesn't conform to typescript's own type
       * definition of it (`LossOrMetricFn` in @tensorflow/tfjs-layers/dist/types.d.ts).
       * I've filed a PR for it here:
       * https://github.com/tensorflow/tfjs/pull/6780
       */
      // case LossFunction.CosineDistance: {
      //   return losses.cosineDistance;
      // }
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

  const metrics = (): ModelCompileArgs["metrics"] => {
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
        default:
          return "categoricalAccuracy";
      }
    });
  };

  const optimizer = (): ModelCompileArgs["optimizer"] => {
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

  return {
    loss: loss(),
    metrics: metrics(),
    optimizer: optimizer(),
  };
};

export const padToMatch = (
  sample: Tensor3D,
  targetDims: { width: number; height: number },
  padMode: "constant" | "reflect" | "symmetric",
  constantValue?: number,
): Tensor3D => {
  const sampleHeight = sample.shape[0];
  const sampleWidth = sample.shape[1];

  const dHeight = targetDims.height - sampleHeight;
  const dWidth = targetDims.width - sampleWidth;

  const padY: [number, number] = [0, 0];
  if (dHeight > 0) {
    padY[0] = Math.floor(dHeight / 2);
    padY[1] = Math.ceil(dHeight / 2);
  }

  const padX: [number, number] = [0, 0];
  if (dWidth > 0) {
    padX[0] = Math.floor(dWidth / 2);
    padX[1] = Math.ceil(dWidth / 2);
  }

  let padded: Tensor3D;

  if (padMode === "constant") {
    padded = sample.pad([padY, padX, [0, 0]], constantValue);
  } else if (padMode === "reflect" || padMode === "symmetric") {
    padded = sample.mirrorPad([padY, padX, [0, 0]], padMode);
  } else {
    throw new Error(`Unrecognized pad mode: ${padMode}`);
  }

  sample.dispose();
  return padded;
};

export const matchedCropPad = ({
  sampleWidth,
  sampleHeight,
  cropWidth,
  cropHeight,
  randomCrop,
}: {
  sampleWidth: number;
  sampleHeight: number;
  cropWidth: number;
  cropHeight: number;
  randomCrop: boolean;
}): [number, number, number, number] => {
  // [y1, x1, y2, x2]
  const cropCoords: [number, number, number, number] = [0.0, 0.0, 1.0, 1.0];

  if (sampleHeight > cropHeight) {
    const hRatio = cropHeight / sampleHeight;
    cropCoords[0] = randomCrop ? random(0, 1 - hRatio) : (1 - hRatio) / 2; // y1 in Random(0, hRatio) or center
    cropCoords[2] = cropCoords[0] + hRatio; // y2 = y1 + hRatio
  }

  if (sampleWidth > cropWidth) {
    const wRatio = cropWidth / sampleWidth;
    cropCoords[1] = randomCrop ? random(0, 1 - wRatio) : (1 - wRatio) / 2; // x1 in Random(0, wRatio) or center
    cropCoords[3] = cropCoords[1] + wRatio; // x2 = x1 + wRatio
  }

  return cropCoords;
};

export const evaluateConfusionMatrix = (
  nClasses: number,
  confusionMatrix: number[][],
) => {
  let precision = 0;
  let recall = 0;
  let f1Score = 0;

  if (nClasses === 2) {
    precision =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[0][1]);
    recall =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[1][0]);
    f1Score = (2 * (precision * recall)) / (precision + recall);
  } else {
    const diagonal: number[] = new Array(nClasses).fill(0);
    const rowSums: number[] = new Array(nClasses).fill(0);
    const colSums: number[] = new Array(nClasses).fill(0);
    for (let i = 0; i < nClasses; i++) {
      for (let j = 0; j < nClasses; j++) {
        if (i === j) {
          diagonal[i] += confusionMatrix[i][j];
        }
        rowSums[i] += confusionMatrix[i][j];
        colSums[j] += confusionMatrix[i][j];
      }
    }

    for (let k = 0; k < nClasses; k++) {
      const classKPrecision = diagonal[k] / rowSums[k];
      const classKRecall = diagonal[k] / colSums[k];
      precision += classKPrecision;
      recall += classKRecall;
      f1Score +=
        (2 * (classKPrecision * classKRecall)) /
        (classKPrecision + classKRecall);
    }
    precision /= nClasses;
    recall /= nClasses;
    f1Score /= nClasses;
  }

  return { precision: precision, recall: recall, f1Score: f1Score };
};

export const getLayersModelSummary = (model: LayersModel): ModelLayerData[] => {
  const modelSummary: ModelLayerData[] = [];

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];

    const outputShape = layer.outputShape;
    const parameters = layer.countParams();
    const layerName = layer.name;
    const trainable = layer.trainable;

    const layerSummary: ModelLayerData = {
      layerName,
      outputShape: String(outputShape).slice(1),
      parameters: parameters,
      trainable: String(trainable),
    };

    modelSummary.push(layerSummary);
  }
  return modelSummary;
};

export const convertArrayToShape = (array: ShapeArray): Shape => {
  return {
    planes: array[0],
    height: array[1],
    width: array[2],
    channels: array[3],
  };
};
