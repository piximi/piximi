import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  OptimizerSettings,
  PreprocessSettings,
  RescaleOptions,
} from "utils/models/types";
import { Group } from "zarr";
import { getAttr, getDatasetSelection, getGroup } from "../../helpers";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import {
  ClassifierStateV01_02,
  PreprocessOptionsV01_02,
} from "utils/file-io/types";
import { initialClassifierStateV01_02 } from "utils/file-io/constants";
import {
  ClassifierState,
  KindClassifierDict,
  ModelClassMap,
  ModelInfo,
} from "store/types";
import { Kind } from "store/data/types";
import { getDefaultModelInfo } from "utils/models/availableClassificationModels";

// COMMON
const deserializeFitOptionsGroup = async (
  fitOptionsGroup: Group,
): Promise<FitOptions> => {
  const epochs = (await getAttr(fitOptionsGroup, "epochs")) as number;
  const batchSize = (await getAttr(fitOptionsGroup, "batch_size")) as number;

  return {
    batchSize,
    epochs,
  };
};

const deserializeCropOptionsGroup = async (
  cropOptionsGroup: Group,
): Promise<CropOptions> => {
  const cropSchema = (await getAttr(
    cropOptionsGroup,
    "crop_schema",
  )) as string as CropSchema;

  const numCrops = (await getAttr(cropOptionsGroup, "num_crops")) as number;

  return { cropSchema, numCrops };
};

const deserializeRescaleOptionsGroup = async (
  rescaleOptionsGroup: Group,
): Promise<RescaleOptions> => {
  const centerRaw = (await getAttr(rescaleOptionsGroup, "center_B")) as number;
  const center = Boolean(centerRaw);
  const rescaleRaw = (await getAttr(
    rescaleOptionsGroup,
    "rescale_B",
  )) as number;
  const rescale = Boolean(rescaleRaw);

  return { center, rescale };
};

// Deserializers for v0.1.0 - v1.0.0

type OptSettings = {
  optimizationAlgorithm: OptimizationAlgorithm;
  learningRate: number;
  lossFunction: LossFunction;
  fitOptions: FitOptions;
};
const deserializeOptimizerSettingsGroupv01_1 = async (
  optSettingsGroup: Group,
): Promise<OptSettings> => {
  const fitOptions = await deserializeFitOptionsGroup(optSettingsGroup);

  const optimizationAlgorithm = (await getAttr(
    optSettingsGroup,
    "optimization_algorithm",
  )) as string as OptimizationAlgorithm;
  const learningRateRaw = (await getAttr(
    optSettingsGroup,
    "learning_rate",
  )) as number;
  // round to account for serialization error
  // convert to number
  const learningRate = +learningRateRaw.toFixed(6);
  const lossFunction = (await getAttr(
    optSettingsGroup,
    "loss_function",
  )) as string as LossFunction;

  return {
    optimizationAlgorithm,
    learningRate,
    lossFunction,
    fitOptions,
  };
};
const deserializePreprocessOptionsGroupV01_1 = async (
  preprocessOptionsGroup: Group,
): Promise<PreprocessOptionsV01_02> => {
  const shuffleRaw = (await getAttr(
    preprocessOptionsGroup,
    "shuffle_B",
  )) as number;
  const shuffle = Boolean(shuffleRaw);

  const cropOptionsGroup = await getGroup(
    preprocessOptionsGroup,
    "crop_options",
  );
  const cropOptions = await deserializeCropOptionsGroup(cropOptionsGroup);

  const rescaleOptionsGroup = await getGroup(
    preprocessOptionsGroup,
    "rescale_options",
  );
  const rescaleOptions =
    await deserializeRescaleOptionsGroup(rescaleOptionsGroup);

  return { cropOptions, rescaleOptions, shuffle };
};

export const deserializeClassifierGroupV01_1 = async (
  classifierGroup: Group,
): Promise<ClassifierStateV01_02> => {
  const inputShape = await getDatasetSelection(classifierGroup, "input_shape", [
    null,
  ]);
  const [planes, height, width, channels] = inputShape.data;

  // round to account for serialization error
  // convert to number
  const trainingPercentageRaw = (await getAttr(
    classifierGroup,
    "training_percent",
  )) as number;
  const trainingPercentage = +trainingPercentageRaw.toFixed(2);

  const metrics = (await getAttr(
    classifierGroup,
    "metrics",
  )) as string[] as Metric[];

  const optSettingsGroup = await getGroup(
    classifierGroup,
    "optimizer_settings",
  );

  const { optimizationAlgorithm, learningRate, lossFunction, fitOptions } =
    await deserializeOptimizerSettingsGroupv01_1(optSettingsGroup);

  const preprocessOptionsGroup = await getGroup(
    classifierGroup,
    "preprocess_options",
  );
  const preprocessOptions = await deserializePreprocessOptionsGroupV01_1(
    preprocessOptionsGroup,
  );

  return {
    ...initialClassifierStateV01_02,
    // @ts-ignore : TODO
    fitOptions,
    inputShape: {
      planes,
      height,
      width,
      channels,
    },
    metrics,
    preprocessOptions,
    learningRate,
    lossFunction,
    optimizationAlgorithm,
    trainingPercentage,
  };
};

// Deserializers for v1.1.0

const deserializePreprocessSettingsGroupV11 = async (
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

const deserializeOptimizerSettingsGroupV11 = async (
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
  const optimizerSettings = await deserializeOptimizerSettingsGroupV11(
    optimizerSettingsGroup,
  );
  const preprocessSettings = await deserializePreprocessSettingsGroupV11(
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

export const deserializeClassifierGroupV11 = async (
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
