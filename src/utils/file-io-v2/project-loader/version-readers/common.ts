import { initialState as initialSegmenterState } from "store/segmenter/segmenterSlice";

import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/modelsV2/enums";

import { getAttr, getDatasetSelection, getGroup } from "../zarr/utils";
import { initialClassifierStateV01_02 } from "./constants";

import type {
  V01ClassifierEvaluationResultType,
  V01ClassifierState,
  V01ColorsRaw,
  V01CropOptions,
  V01FitOptions,
  V01RescaleOptions,
} from "./version-types/v01Types";
import type {
  V11ClassifierState,
  V11Kind,
  V11KindClassifierDict,
  V11ModelClassMap,
  V11ModelInfo,
} from "./version-types/v11Types";
import type { Group } from "zarr";
// ============================================================
// Color deserialization (raw arrays, no Tensor)
// ============================================================

export async function deserializeColorsRaw(
  colorsGroup: Group,
): Promise<V01ColorsRaw> {
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

  const range: V01ColorsRaw["range"] = {};
  const visible: V01ColorsRaw["visible"] = {};
  const color: [number, number, number][] = [];

  for (let i = 0; i < numChannels; i++) {
    range[i] = [rangeMins[i], rangeMaxs[i]];
    visible[i] = Boolean(visibilities[i]);
    color.push([colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]]);
  }

  return { range, visible, color };
}

// ============================================================
// Classifier deserialization
// ============================================================

export const deserializeFitOptionsGroup = async (
  fitOptionsGroup: Group,
): Promise<V01FitOptions> => {
  const epochs = (await getAttr(fitOptionsGroup, "epochs")) as number;
  const batchSize = (await getAttr(fitOptionsGroup, "batch_size")) as number;

  return {
    batchSize,
    epochs,
  };
};

export const deserializeCropOptionsGroup = async (
  cropOptionsGroup: Group,
): Promise<V01CropOptions> => {
  const cropSchema = (await getAttr(
    cropOptionsGroup,
    "crop_schema",
  )) as string as CropSchema;

  const numCrops = (await getAttr(cropOptionsGroup, "num_crops")) as number;

  return { cropSchema, numCrops };
};

export const deserializeRescaleOptionsGroup = async (
  rescaleOptionsGroup: Group,
): Promise<V01RescaleOptions> => {
  const centerRaw = (await getAttr(rescaleOptionsGroup, "center_B")) as number;
  const center = Boolean(centerRaw);
  const rescaleRaw = (await getAttr(
    rescaleOptionsGroup,
    "rescale_B",
  )) as number;
  const rescale = Boolean(rescaleRaw);

  return { center, rescale };
};

// ============================================================
// V01-V02 Classifier deserializer
// ============================================================

export const v01_02_deserializeClassifierGroup = async (
  classifierGroup: Group,
): Promise<V01ClassifierState> => {
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
  const preprocessOptionsGroup = await getGroup(
    classifierGroup,
    "preprocess_options",
  );
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
  const preprocessOptions = { cropOptions, rescaleOptions, shuffle };
  return {
    ...initialClassifierStateV01_02,
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

// ============================================================
// V11-V2 Classifier deserializer
// ============================================================

export const v11_v2_deserializeClassifierGroup = async (
  classifierGroup: Group,
): Promise<V11ClassifierState> => {
  const kindClassifiers: V11KindClassifierDict = {};
  const classifierKinds = (await getAttr(
    classifierGroup,
    "classifier_kinds",
  )) as V11Kind["id"][];

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

      // -- Deserialize Optimizer Settings
      const optimizerSettingsGroup = await getGroup(
        infoGroup,
        "optimizer_settings",
      );
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
      const optimizerSettings = {
        epochs,
        batchSize,
        optimizationAlgorithm,
        learningRate,
        lossFunction,
        metrics,
      };

      // -- Deserialize Preprocessing Settings
      const preprocessSettingsGroup = await getGroup(
        infoGroup,
        "preprocessing_settings",
      );
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

      const preprocessSettings = {
        inputShape: { planes, height, width, channels },
        cropOptions,
        rescaleOptions,
        shuffle,
        trainingPercentage,
      };

      // -- Deserialize Evaluation Results
      const evalResults = (await getAttr(
        infoGroup,
        "eval_results",
      )) as V01ClassifierEvaluationResultType[];

      const classMapArray: [number, string][] = await getAttr(
        infoGroup,
        "class_map",
      );
      kindClassifiers[kindId].modelInfoDict[name] = {
        ...v11_v2_GetDefaultModelInfo(),
        preprocessSettings,
        optimizerSettings,
        classMap:
          classMapArray.length > 0
            ? classMapArray.reduce((mapDict: V11ModelClassMap, mapItem) => {
                mapDict[mapItem[0]] = mapItem[1];
                return mapDict;
              }, {})
            : undefined,
        evalResults,
      };
    }
  }

  return {
    showClearPredictionsWarning: true,
    kindClassifiers,
  };
};
export const v11_v2_GetDefaultModelParams = (): Pick<
  V11ModelInfo,
  "optimizerSettings" | "preprocessSettings"
> => ({
  optimizerSettings: {
    epochs: 10,
    batchSize: 32,
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  preprocessSettings: {
    inputShape: {
      planes: 1,
      height: 20,
      width: 20,
      channels: 1,
    },
    shuffle: true,
    rescaleOptions: {
      rescale: true,
      center: false,
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
    trainingPercentage: 0.75,
  },
});

export const v11_v2_GetDefaultModelInfo = (): V11ModelInfo => ({
  ...v11_v2_GetDefaultModelParams(),
  evalResults: [],
});
// ============================================================
// Segmenter deserializer
// ============================================================

export const deserializeSegmenterGroup = async (segmenterGroup: Group) => {
  // present, but not used currently
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const modelName = await getAttr(segmenterGroup, "name");

  // TODO - decode segmenter once encoding scheme developed
  return initialSegmenterState;
};
