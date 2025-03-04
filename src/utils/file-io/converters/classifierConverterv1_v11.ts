import {
  availableClassifierModels,
  DEFAULT_MODEL_INFO,
} from "utils/models/availableClassificationModels";
import { ClassifierStateV01_02 } from "../types";
import { OptimizerSettings, PreprocessSettings } from "utils/models/types";
import { Kind } from "store/data/types";
import { ClassifierState, KindClassifierDict, ModelParams } from "store/types";

export const classifierConverterv1_v11 = (
  classifier: ClassifierStateV01_02,
  kindIds: Array<Kind["id"]>,
): ClassifierState => {
  const kindClassifiers: KindClassifierDict = {};
  const preprocessSettings: PreprocessSettings = {
    ...classifier.preprocessOptions,
    trainingPercentage: classifier.trainingPercentage,
  };
  const optimizerSettings: OptimizerSettings = {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
    epochs: classifier.fitOptions.epochs,
    batchSize: classifier.fitOptions.batchSize,
  };
  const inputShape = classifier.inputShape;
  const modelParams: ModelParams = {
    inputShape,
    preprocessSettings,
    optimizerSettings,
  };

  kindIds.forEach((kindId) => {
    kindClassifiers[kindId] = { selectedModelIdx: 0, modelInfoDict: {} };
    for (const i in availableClassifierModels)
      kindClassifiers[kindId].modelInfoDict[i] = {
        ...DEFAULT_MODEL_INFO,
        params: modelParams,
      };
  });
  return {
    showClearPredictionsWarning: true,
    kindClassifiers,
  };
};
