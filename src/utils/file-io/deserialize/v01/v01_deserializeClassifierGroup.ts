// Deserializers for v0.1.0 - v1.0.0

import {
  V01_ClassifierState,
  V01_PreprocessOptions,
} from "utils/file-io/types";
import {
  getAttr,
  getDatasetSelection,
  getGroup,
} from "utils/file-io/zarr/zarrUtils";
import {
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { FitOptions } from "utils/models/types";
import { Group } from "zarr";
import {
  deserializeCropOptionsGroup,
  deserializeFitOptionsGroup,
  deserializeRescaleOptionsGroup,
} from "../common/group-deserializers/deserializeClassifierHelpers";
import { initialClassifierStateV01_02 } from "utils/file-io/constants";

type OptSettings = {
  optimizationAlgorithm: OptimizationAlgorithm;
  learningRate: number;
  lossFunction: LossFunction;
  fitOptions: FitOptions;
};
const deserializeOptimizerSettingsGroup = async (
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
const deserializePreprocessOptionsGroup = async (
  preprocessOptionsGroup: Group,
): Promise<V01_PreprocessOptions> => {
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

export const v01_deserializeClassifierGroup = async (
  classifierGroup: Group,
): Promise<V01_ClassifierState> => {
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
    await deserializeOptimizerSettingsGroup(optSettingsGroup);

  const preprocessOptionsGroup = await getGroup(
    classifierGroup,
    "preprocess_options",
  );
  const preprocessOptions = await deserializePreprocessOptionsGroup(
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
