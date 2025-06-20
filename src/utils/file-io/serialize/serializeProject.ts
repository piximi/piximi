import { Group, NestedArray, group } from "zarr";
import { Tensor } from "@tensorflow/tfjs";
//import { Blosc } from "numcodecs";

import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { PiximiStore } from "../zarr/stores";
import classifierHandler from "utils/models/classification/classifierHandler";

import {
  OptimizerSettings,
  PreprocessSettings,
  SerializedModels,
} from "utils/models/types";
import { LoadCB } from "../types";
import {
  ClassifierState,
  ModelInfo,
  ProjectState,
  SegmenterState,
} from "store/types";
import { Colors } from "utils/types";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
} from "store/data/types";

/* 
   =====================
   Project Serialization
   =====================
 */

const serializeImageColors = async (colorsGroup: Group, colors: Colors) => {
  const numChannels = colors.color.shape[0];
  const rangeMins = new Float32Array(numChannels);
  const rangeMaxs = new Float32Array(numChannels);
  const visibilities = new Uint8Array(numChannels);

  for (let i = 0; i < numChannels; i++) {
    rangeMins[i] = colors.range[i][0];
    rangeMaxs[i] = colors.range[i][1];
    visibilities[i] = Number(colors.visible[i]);
  }

  await writeArray(colorsGroup, "range_min", rangeMins);
  await writeArray(colorsGroup, "range_max", rangeMaxs);
  await writeArray(colorsGroup, "visible_B", visibilities);

  await writeTensor(colorsGroup, "color", colors.color, [
    colors.color.shape[0],
    colors.color.shape[1],
  ]);
};

const serializeThings = async (
  thingsGroup: Group,
  things: Array<AnnotationObject | ImageObject>,
  loadCb: LoadCB,
) => {
  const thingNames = things.map((thing) => thing.name);

  thingsGroup.attrs.setItem("thing_names", thingNames);
  loadCb(0, `serializing ${things.length} images`);

  for (let i = 0; i < things.length; i++) {
    const thing = things[i];
    const thingGroup = await thingsGroup.createGroup(thingNames[i]);
    const data = await writeTensor(thingGroup, thingNames[i], thing.data, [
      thing.shape.planes,
      thing.shape.height,
      thing.shape.width,
      thing.shape.channels,
    ]);
    await data.attrs.setItem("bit_depth", thing.bitDepth);
    // const bd = await getAttr(data, "bit_depth");

    await thingGroup.attrs.setItem("thing_id", thing.id);
    await thingGroup.attrs.setItem("active_plane", thing.activePlane);
    await thingGroup.attrs.setItem("class_category_id", thing.categoryId);
    await thingGroup.attrs.setItem("classifier_partition", thing.partition);
    await thingGroup.attrs.setItem("kind", thing.kind);

    if (thing.kind === "Image") {
      await thingGroup.attrs.setItem(
        "contents",
        (thing as ImageObject).containing,
      );

      const colorGroup = await thingGroup.createGroup("colors");
      await serializeImageColors(colorGroup, (thing as ImageObject).colors);
    } else {
      await thingGroup.attrs.setItem(
        "bbox",
        (thing as AnnotationObject).boundingBox,
      );
      await thingGroup.attrs.setItem(
        "mask",
        (thing as AnnotationObject).encodedMask,
      );
      await thingGroup.attrs.setItem(
        "image_id",
        (thing as AnnotationObject).imageId,
      );
    }
    loadCb(
      (i + 1) / thingNames.length,
      `serialized image ${i + 1}/${thingNames.length}`,
    );
  }
};

const serializeCategories = async (
  categoryGroup: Group,
  categories: Category[],
) => {
  await categoryGroup.attrs.setItem(
    "category_id",
    categories.map((cat) => cat.id),
  );
  await categoryGroup.attrs.setItem(
    "color",
    categories.map((cat) => cat.color),
  );
  await categoryGroup.attrs.setItem(
    "name",
    categories.map((cat) => cat.name),
  );
  await categoryGroup.attrs.setItem(
    "kind",
    categories.map((cat) => cat.kind),
  );
  await categoryGroup.attrs.setItem(
    "contents",
    categories.map((cat) => cat.containing),
  );
};
const serializeKinds = async (kindGroup: Group, kinds: Kind[]) => {
  await kindGroup.attrs.setItem(
    "kind_id",
    kinds.map((k) => k.id),
  );
  await kindGroup.attrs.setItem(
    "contents",
    kinds.map((k) => k.containing),
  );
  await kindGroup.attrs.setItem(
    "categories",
    kinds.map((k) => k.categories),
  );
  await kindGroup.attrs.setItem(
    "unknown_category_id",
    kinds.map((k) => k.unknownCategoryId),
  );
  await kindGroup.attrs.setItem(
    "display_name",
    kinds.map((k) => k.displayName),
  );
};

const _serializeProject = async (
  projectGroup: Group,
  project: ProjectState,
  data: {
    kinds: Array<Kind>;
    categories: Array<Category>;
    things: Array<ImageObject | AnnotationObject>;
  },
  loadCb: LoadCB,
) => {
  await projectGroup.attrs.setItem("name", project.name);
  await projectGroup.attrs.setItem(
    "imageChannels",
    project.imageChannels ?? "undefined",
  );

  const thingsGroup = await projectGroup.createGroup("things");

  await serializeThings(thingsGroup, data.things, loadCb);

  const categoriesGroup = await projectGroup.createGroup("categories");
  await serializeCategories(categoriesGroup, data.categories);

  const kindsGroup = await projectGroup.createGroup("kinds");
  await serializeKinds(kindsGroup, data.kinds);
};

/*
  ========================
  Classifier Serialization
  ========================
 */

const serializePreprocessOptions = async (
  preprocessOptionsGroup: Group,
  preprocessSettings: PreprocessSettings,
) => {
  const { planes, height, width, channels } = preprocessSettings.inputShape;
  await writeArray(
    preprocessOptionsGroup,
    "input_shape",
    new Uint8Array([planes, height, width, channels]),
  );
  await preprocessOptionsGroup.attrs.setItem(
    "shuffle_B",
    Number(preprocessSettings.shuffle),
  );

  const rescaleOptionsGroup =
    await preprocessOptionsGroup.createGroup("rescale_options");

  await rescaleOptionsGroup.attrs.setItem(
    "rescale_B",
    Number(preprocessSettings.rescaleOptions.rescale),
  );

  await rescaleOptionsGroup.attrs.setItem(
    "center_B",
    Number(preprocessSettings.rescaleOptions.center),
  );

  const cropOptionsGroup =
    await preprocessOptionsGroup.createGroup("crop_options");
  await cropOptionsGroup.attrs.setItem(
    "num_crops",
    preprocessSettings.cropOptions.numCrops,
  );
  await cropOptionsGroup.attrs.setItem(
    "crop_schema",
    preprocessSettings.cropOptions.cropSchema,
  );
  await preprocessOptionsGroup.attrs.setItem(
    "training_percent",
    preprocessSettings.trainingPercentage,
  );
};

const serializeOptimizerSettings = async (
  optimizerSettingsGroup: Group,
  optimizerSettings: OptimizerSettings,
) => {
  await optimizerSettingsGroup.attrs.setItem(
    "metrics",
    optimizerSettings.metrics,
  );
  await optimizerSettingsGroup.attrs.setItem(
    "epochs",
    optimizerSettings.epochs,
  );

  await optimizerSettingsGroup.attrs.setItem(
    "batch_size",
    optimizerSettings.batchSize,
  );

  await optimizerSettingsGroup.attrs.setItem(
    "optimization_algorithm",
    optimizerSettings.optimizationAlgorithm,
  );

  await optimizerSettingsGroup.attrs.setItem(
    "learning_rate",
    optimizerSettings.learningRate,
  );

  await optimizerSettingsGroup.attrs.setItem(
    "loss_function",
    optimizerSettings.lossFunction,
  );
};

const serializeModelInfo = async (infoGroup: Group, modelInfo: ModelInfo) => {
  const preprocessSetingsGroup = await infoGroup.createGroup(
    "preprocessing_settings",
  );
  const optimizerSettingsGroup =
    await infoGroup.createGroup("optimizer_settings");

  await infoGroup.attrs.setItem("eval_results", modelInfo.evalResults);

  let classMapArray: [number, string][] = [];
  if (modelInfo.classMap) {
    classMapArray = Object.entries(modelInfo.classMap).map(([key, value]) => [
      +key,
      value,
    ]);
  }
  await infoGroup.attrs.setItem("class_map", classMapArray);

  await serializePreprocessOptions(
    preprocessSetingsGroup,
    modelInfo.preprocessSettings,
  );
  await serializeOptimizerSettings(
    optimizerSettingsGroup,
    modelInfo.optimizerSettings,
  );
};

const serializeClassifier = async (
  classifierGroup: Group,
  classifier: ClassifierState,
) => {
  const kindClassifiers = classifier.kindClassifiers;
  const classifierKindIds = Object.keys(kindClassifiers);
  await classifierGroup.attrs.setItem("classifier_kinds", classifierKindIds);

  for await (const kindId of classifierKindIds) {
    const kindClassifiersInfo = kindClassifiers[kindId];
    const kindClassifierGroup = await classifierGroup.createGroup(kindId);
    const kindModels = Object.keys(kindClassifiersInfo.modelInfoDict);

    await kindClassifierGroup.attrs.setItem("models", kindModels);

    for await (const modelName of kindModels) {
      const modelInfo = kindClassifiersInfo.modelInfoDict[modelName];
      const modelGroup = await kindClassifierGroup.createGroup(modelName);

      await modelGroup.attrs.setItem("name", modelName);

      const modelInfoGroup = await modelGroup.createGroup("model_info");
      await serializeModelInfo(modelInfoGroup, modelInfo);
    }
  }
  const userModels: SerializedModels = {};
  for await (const modelName of classifierHandler.getModelNames()) {
    const model = classifierHandler.getModel(modelName);
    const savedModelInfo = await model.getSavedModelFiles();
    userModels[modelName] = {
      modelJson: {
        blob: savedModelInfo.modelJsonBlob,
        fileName: savedModelInfo.modelJsonFileName,
      },
      modelWeights: {
        blob: savedModelInfo.weightsBlob,
        fileName: savedModelInfo.weightsFileName,
      },
    };
  }
  return userModels;
};

const serializeSegmenter = async (
  segmenterGroup: Group,
  segmenter: SegmenterState,
) => {
  const segmenterModel =
    segmenter.selectedModelIdx === undefined
      ? { name: "undefined" }
      : availableSegmenterModels[segmenter.selectedModelIdx];

  await segmenterGroup.attrs.setItem("name", segmenterModel.name);
};

/*
  ===========
  Entry Point
  ===========
 */

export const serializeProject = async (
  name: string,
  projectSlice: ProjectState,
  data: {
    kinds: Array<Kind>;
    categories: Array<Category>;
    things: Array<ImageObject | AnnotationObject>;
  },
  classifierSlice: ClassifierState,
  segmenterSlice: SegmenterState,
  loadCb: LoadCB,
) => {
  const piximiStore = new PiximiStore(name);
  const root = await group(piximiStore, piximiStore.rootName);

  // pnpm start/build must be run with VITE_APP_VERSION=$npm_package_version
  const piximiVersion = import.meta.env.VITE_APP_VERSION;

  if (!piximiVersion) {
    throw Error("Missing Piximi version");
  }

  root.attrs.setItem("version", piximiVersion);

  const projectGroup = await root.createGroup("project");
  await _serializeProject(projectGroup, projectSlice, data, loadCb);
  const classifierGroup = await root.createGroup("classifier");
  const userModels = await serializeClassifier(
    classifierGroup,
    classifierSlice,
  );
  piximiStore.attachModels(userModels);

  const segmenterGroup = await root.createGroup("segmenter");
  await serializeSegmenter(segmenterGroup, segmenterSlice);

  return piximiStore.zip;
};

/*
  ==========================
  File Serialization Helpers
  ==========================
 */

/*
 * tensor.dataSync() returns either a Float32Array, Uint8Array
 * or Int32Array. The reason for recasting it is because the returned
 * data's buffer (rawData.buffer) sometimes has extra padding bytes.
 * recasting it as its own TypedArray sets a new underlying buffer
 * of the appropriate byteLength
 */
const cleanBuffer = (tensor: Tensor) => {
  const rawData = tensor.dataSync();

  if (rawData instanceof Float32Array) {
    return Float32Array.from(rawData);
  } else if (rawData instanceof Int32Array) {
    return Int32Array.from(rawData);
  } else if (rawData instanceof Uint8Array) {
    return Uint8Array.from(rawData);
  } else {
    return rawData;
  }
};

const writeArray = async (
  group: Group,
  name: string,
  value: Float32Array | Uint8Array | Int32Array | Uint16Array | Uint32Array,
  shape?: number[],
) => {
  const nested = new NestedArray(value, shape);
  return group.createDataset(name, undefined, nested, {
    chunks: false,
    fillValue: 0.0,
    //compressor: { id: Blosc.codecId },
  });
};

const writeTensor = async (
  group: Group,
  name: string,
  tensor: Tensor,
  shape?: number[],
) => {
  return writeArray(
    group,
    name,
    cleanBuffer(tensor),
    shape ? shape : tensor.shape,
  );
};
