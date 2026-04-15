import { v11_v2_GetDefaultModelInfo } from "../version-readers/common";
import {
  V02ClassifierState,
  V02Kind,
  V02PiximiState,
} from "../version-readers/version-types/v02Types";
import {
  V11ClassifierState,
  V11KindClassifierDict,
  V11OptimizerSettings,
  V11PiximiState,
  V11PreprocessSettings,
} from "../version-readers/version-types/v11Types";

/**
 * Convert v0.2 project data to v1.1 format.
 *
 * Key transformations:
 * - Restructures classifier from global to per-kind format
 * - Data section (things, categories, kinds) passes through unchanged
 *   (V11 data types are identical to V02)
 *
 */
export function convertV02ToV11(v02: V02PiximiState): V11PiximiState {
  const { classifier: oldClassifier, data } = v02;
  const classifier = v02_11_classifierConverter(oldClassifier, data.kinds.ids);
  return {
    project: v02.project,
    data: v02.data,
    segmenter: v02.segmenter,
    classifier,
  };
}

const v02_11_classifierConverter = (
  classifier: V02ClassifierState,
  kindIds: Array<V02Kind["id"]>,
): V11ClassifierState => {
  const kindClassifiers: V11KindClassifierDict = {};
  const preprocessSettings: V11PreprocessSettings = {
    ...classifier.preprocessOptions,
    inputShape: classifier.inputShape,
    trainingPercentage: classifier.trainingPercentage,
  };
  const optimizerSettings: V11OptimizerSettings = {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
    epochs: classifier.fitOptions.epochs,
    batchSize: classifier.fitOptions.batchSize,
  };

  kindIds.forEach((kindId) => {
    kindClassifiers[kindId] = {
      modelNameOrArch: 0,
      modelInfoDict: {
        "base-model": {
          ...v11_v2_GetDefaultModelInfo(),
          preprocessSettings,
          optimizerSettings,
        },
      },
    };
  });
  return {
    showClearPredictionsWarning: true,
    kindClassifiers,
  };
};
