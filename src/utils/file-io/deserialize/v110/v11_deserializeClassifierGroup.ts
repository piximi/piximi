// Deserializers for v1.1.0

import {
  getAttr,
  getDatasetSelection,
  getGroup,
} from "utils/file-io/zarr/zarrUtils";
import {
  ClassifierEvaluationResultType,
  OptimizerSettings,
  PreprocessSettings,
} from "utils/models/types";
import { Group } from "zarr";
import {
  deserializeCropOptionsGroup,
  deserializeFitOptionsGroup,
  deserializeRescaleOptionsGroup,
} from "../common/group-deserializers/deserializeClassifierHelpers";
import {
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import {
  ClassifierState,
  KindClassifierDict,
  ModelClassMap,
  ModelInfo,
} from "store/types";
import { getDefaultModelInfo } from "utils/models/classification/utils";
import { Kind } from "store/data/types";

const deserializePreprocessSettingsGroup = async (
  preprocessSettingsGroup: Group,
): Promise<PreprocessSettings> => {
  const inputShape = await getDatasetSelection(
    preprocessSettingsGroup,
    "input_shape",
    [null],
  );
  const [planes, height, width, channels] = inputShape.data;
  const shuffleRaw = (await getAttr(
    preprocessSettingsGroup,
    "shuffle_B",
  )) as number;
  const shuffle = Boolean(shuffleRaw);

  const cropOptionsGroup = await getGroup(
    preprocessSettingsGroup,
    "crop_options",
  );
  const cropOptions = await deserializeCropOptionsGroup(cropOptionsGroup);

  const rescaleOptionsGroup = await getGroup(
    preprocessSettingsGroup,
    "rescale_options",
  );
  const rescaleOptions =
    await deserializeRescaleOptionsGroup(rescaleOptionsGroup);
  const trainingPercentageRaw = (await getAttr(
    preprocessSettingsGroup,
    "training_percent",
  )) as number;
  const trainingPercentage = +trainingPercentageRaw.toFixed(2);
  return {
    inputShape: { planes, height, width, channels },
    cropOptions,
    rescaleOptions,
    shuffle,
    trainingPercentage,
  };
};

const deserializeOptimizerSettingsGroup = async (
  optimizerSettingsGroup: Group,
): Promise<OptimizerSettings> => {
  const { epochs, batchSize } = await deserializeFitOptionsGroup(
    optimizerSettingsGroup,
  );

  const optimizationAlgorithm = (await getAttr(
    optimizerSettingsGroup,
    "optimization_algorithm",
  )) as string as OptimizationAlgorithm;

  const learningRateRaw = (await getAttr(
    optimizerSettingsGroup,
    "learning_rate",
  )) as number;
  // round to account for serialization error
  // convert to number
  const learningRate = +learningRateRaw.toFixed(6);

  const lossFunction = (await getAttr(
    optimizerSettingsGroup,
    "loss_function",
  )) as string as LossFunction;

  const metrics = (await getAttr(
    optimizerSettingsGroup,
    "metrics",
  )) as string[] as Metric[];

  return {
    epochs,
    batchSize,
    optimizationAlgorithm,
    learningRate,
    lossFunction,
    metrics,
  };
};
const deserializeModelInfo = async (infoGroup: Group): Promise<ModelInfo> => {
  const optimizerSettingsGroup = await getGroup(
    infoGroup,
    "optimizer_settings",
  );
  const preprocessSetingsGroup = await getGroup(
    infoGroup,
    "preprocessing_settings",
  );
  const classMapArray = (await getAttr(infoGroup, "class_map")) as [
    number,
    string,
  ][];
  let classMap: ModelClassMap | undefined;
  if (classMapArray.length > 0) {
    classMap = classMapArray.reduce((mapDict: ModelClassMap, mapItem) => {
      mapDict[mapItem[0]] = mapItem[1];
      return mapDict;
    }, {});
  }
  const optimizerSettings = await deserializeOptimizerSettingsGroup(
    optimizerSettingsGroup,
  );
  const preprocessSettings = await deserializePreprocessSettingsGroup(
    preprocessSetingsGroup,
  );

  const evalResults = (await getAttr(
    infoGroup,
    "eval_results",
  )) as ClassifierEvaluationResultType[];

  return {
    preprocessSettings,
    optimizerSettings,
    classMap,
    evalResults,
  };
};

export const v11_deserializeClassifierGroup = async (
  classifierGroup: Group,
): Promise<ClassifierState> => {
  const kindClassifiers: KindClassifierDict = {};
  const classifierKinds = (await getAttr(
    classifierGroup,
    "classifier_kinds",
  )) as Kind["id"][];

  for await (const kindId of classifierKinds) {
    const kindModelsGroup = await getGroup(classifierGroup, kindId);
    const kindModels = (await getAttr(kindModelsGroup, "models")) as string[];
    kindClassifiers[kindId] = {
      modelNameOrArch: 0,
      modelInfoDict: {},
    };

    for await (const name of kindModels) {
      const modelGroup = await getGroup(kindModelsGroup, name);
      const infoGroup = await getGroup(modelGroup, "model_info");
      const modelInfo = await deserializeModelInfo(infoGroup);
      kindClassifiers[kindId].modelInfoDict[name] = {
        ...getDefaultModelInfo(),
        ...modelInfo,
      };
    }
  }

  return {
    showClearPredictionsWarning: true,
    kindClassifiers,
  };
};
