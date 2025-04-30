import { getDefaultModelInfo } from "utils/models/availableClassificationModels";
import { ClassifierStateV01_02 } from "../types";
import { OptimizerSettings, PreprocessSettings } from "utils/models/types";
import { Kind } from "store/data/types";
import { ClassifierState, KindClassifierDict } from "store/types";

export const projectConverterv1_v11 = (
  classifier: ClassifierStateV01_02,
  kindIds: Array<Kind["id"]>,
): ClassifierState => {
  const kindClassifiers: KindClassifierDict = {};
  const preprocessSettings: PreprocessSettings = {
    ...classifier.preprocessOptions,
    inputShape: classifier.inputShape,
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

  kindIds.forEach((kindId) => {
    kindClassifiers[kindId] = {
      modelNameOrArch: 0,
      modelInfoDict: {
        "base-model": {
          ...getDefaultModelInfo(),
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
