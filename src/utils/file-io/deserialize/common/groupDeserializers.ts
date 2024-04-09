import { Group } from "zarr";
import { getAttr, getDatasetSelection, getGroup } from "../helpers";
import { tensor2d } from "@tensorflow/tfjs";
import { initialState as initialClassifierState } from "store/classifier/classifierSlice";
import { initialState as initialSegmenterState } from "store/segmenter/segmenterSlice";
import {
  CropOptions,
  FitOptions,
  PreprocessOptions,
  RescaleOptions,
} from "utils/models/types";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { ClassifierState } from "store/types";
import { Colors } from "utils/common/types";

export const deserializeColorsGroup = async (
  colorsGroup: Group
): Promise<Colors> => {
  const colorsDataset = await getDatasetSelection(colorsGroup, "color", [null]);
  const numChannels = colorsDataset.shape[0];
  const colors = colorsDataset.data as Float32Array;
  const rangeMaxs = await getDatasetSelection(colorsGroup, "range_max", [
    null,
  ]).then((ra) => ra.data as Float32Array);
  const rangeMins = await getDatasetSelection(colorsGroup, "range_min", [
    null,
  ]).then((ra) => ra.data as Float32Array);
  const visibilities = await getDatasetSelection(colorsGroup, "visible_B", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  if (
    rangeMaxs.length !== numChannels ||
    rangeMins.length !== numChannels ||
    visibilities.length !== numChannels
  ) {
    throw Error(
      `Expected colors group "${colorsGroup.path}" to have "${numChannels}" channels, range and visibility`
    );
  }

  let range: Colors["range"] = {};
  let visible: Colors["visible"] = {};
  for (let i = 0; i < numChannels; i++) {
    range[i] = [rangeMins[i], rangeMaxs[i]];
    visible[i] = Boolean(visibilities[i]);
  }

  return {
    range,
    visible,
    color: tensor2d(colors, [numChannels, 3], "float32"),
  };
};

const deserializeFitOptionsGroup = async (
  fitOptionsGroup: Group
): Promise<FitOptions> => {
  const epochs = (await getAttr(fitOptionsGroup, "epochs")) as number;
  const batchSize = (await getAttr(fitOptionsGroup, "batch_size")) as number;

  return {
    batchSize,
    epochs,
  };
};

type OptSettings = {
  optimizationAlgorithm: OptimizationAlgorithm;
  learningRate: number;
  lossFunction: LossFunction;
  fitOptions: FitOptions;
};
const deserializeOptimizerSettingsGroup = async (
  optSettingsGroup: Group
): Promise<OptSettings> => {
  const fitOptions = await deserializeFitOptionsGroup(optSettingsGroup);

  const optimizationAlgorithm = (await getAttr(
    optSettingsGroup,
    "optimization_algorithm"
  )) as string as OptimizationAlgorithm;
  const learningRateRaw = (await getAttr(
    optSettingsGroup,
    "learning_rate"
  )) as number;
  // round to account for serialization error
  // convert to number
  const learningRate = +learningRateRaw.toFixed(6);
  const lossFunction = (await getAttr(
    optSettingsGroup,
    "loss_function"
  )) as string as LossFunction;

  return {
    optimizationAlgorithm,
    learningRate,
    lossFunction,
    fitOptions,
  };
};

const deserializeCropOptionsGroup = async (
  cropOptionsGroup: Group
): Promise<CropOptions> => {
  const cropSchema = (await getAttr(
    cropOptionsGroup,
    "crop_schema"
  )) as string as CropSchema;

  const numCrops = (await getAttr(cropOptionsGroup, "num_crops")) as number;

  return { cropSchema, numCrops };
};

const deserializeRescaleOptionsGroup = async (
  rescaleOptionsGroup: Group
): Promise<RescaleOptions> => {
  const centerRaw = (await getAttr(rescaleOptionsGroup, "center_B")) as number;
  const center = Boolean(centerRaw);
  const rescaleRaw = (await getAttr(
    rescaleOptionsGroup,
    "rescale_B"
  )) as number;
  const rescale = Boolean(rescaleRaw);

  return { center, rescale };
};

const deserializePreprocessOptionsGroup = async (
  preprocessOptionsGroup: Group
): Promise<PreprocessOptions> => {
  const shuffleRaw = (await getAttr(
    preprocessOptionsGroup,
    "shuffle_B"
  )) as number;
  const shuffle = Boolean(shuffleRaw);

  const cropOptionsGroup = await getGroup(
    preprocessOptionsGroup,
    "crop_options"
  );
  const cropOptions = await deserializeCropOptionsGroup(cropOptionsGroup);

  const rescaleOptionsGroup = await getGroup(
    preprocessOptionsGroup,
    "rescale_options"
  );
  const rescaleOptions = await deserializeRescaleOptionsGroup(
    rescaleOptionsGroup
  );

  return { cropOptions, rescaleOptions, shuffle };
};

export const deserializeClassifierGroup = async (
  classifierGroup: Group
): Promise<ClassifierState> => {
  // present, but not used currently
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const modelName = await getAttr(classifierGroup, "name");

  const inputShape = await getDatasetSelection(classifierGroup, "input_shape", [
    null,
  ]);
  const [planes, height, width, channels] = inputShape.data;

  // round to account for serialization error
  // convert to number
  const trainingPercentageRaw = (await getAttr(
    classifierGroup,
    "training_percent"
  )) as number;
  const trainingPercentage = +trainingPercentageRaw.toFixed(2);

  const metrics = (await getAttr(
    classifierGroup,
    "metrics"
  )) as string[] as Metric[];

  const optSettingsGroup = await getGroup(
    classifierGroup,
    "optimizer_settings"
  );

  const { optimizationAlgorithm, learningRate, lossFunction, fitOptions } =
    await deserializeOptimizerSettingsGroup(optSettingsGroup);

  const preprocessOptionsGroup = await getGroup(
    classifierGroup,
    "preprocess_options"
  );
  const preprocessOptions = await deserializePreprocessOptionsGroup(
    preprocessOptionsGroup
  );

  return {
    ...initialClassifierState,
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

export const deserializeSegmenterGroup = async (segmenterGroup: Group) => {
  // present, but not used currently
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const modelName = await getAttr(segmenterGroup, "name");

  // TODO - decode segmenter once encoding scheme developed
  return initialSegmenterState;
};
