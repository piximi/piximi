import { Group, NestedArray, group } from "zarr";
//import { Blosc } from "numcodecs";

import { Tensor } from "@tensorflow/tfjs";
import { OptimizerSettings, PreprocessSettings } from "utils/models/types";
import { kindClassifierModelDict } from "utils/models/availableClassificationModels";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { ZipStore } from "../zarrStores";
import { LoadCB } from "../types";
import {
  ClassifierState,
  ModelParams,
  ProjectState,
  SegmenterState,
} from "store/types";
import { Colors } from "utils/common/types";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
} from "store/data/types";
import { updateRecordArray } from "utils/common/helpers";

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

const serializeModalParams = async (paramGroup: Group, params: ModelParams) => {
  const { planes, height, width, channels } = params.inputShape;
  await writeArray(
    paramGroup,
    "input_shape",
    new Uint8Array([planes, height, width, channels]),
  );
  const preprocessSetingsGroup = await paramGroup.createGroup(
    "preprocessing_settings",
  );
  await serializePreprocessOptions(
    preprocessSetingsGroup,
    params.preprocessSettings,
  );
  const optimizerSettingsGroup =
    await paramGroup.createGroup("optimizer_settings");
  await serializeOptimizerSettings(
    optimizerSettingsGroup,
    params.optimizerSettings,
  );
};

const serializeClassifier = async (
  classifierGroup: Group,
  classifier: ClassifierState,
) => {
  const kindClassifiers = classifier.kindClassifiers;
  const classifierKinds = Object.keys(kindClassifiers);
  await classifierGroup.attrs.setItem("classifier_kinds", classifierKinds);
  const userModels: Record<
    Kind["id"],
    Array<{
      modelJson: { blob: Blob; fileName: string };
      modelWeights: { blob: Blob; fileName: string };
    }>
  > = {};

  for await (const kindId of classifierKinds) {
    const kindModels = kindClassifiers[kindId];
    const kindClassifierGroup = await classifierGroup.createGroup(kindId);
    const kindModelIdxs = Object.keys(kindModels.modelInfoDict);
    await kindClassifierGroup.attrs.setItem("model_keys", kindModelIdxs);
    for await (const idx of kindModelIdxs) {
      const modelInfo = kindModels.modelInfoDict[idx];
      const classifierModel = kindClassifierModelDict[kindId][+idx];
      const modelGroup = await kindClassifierGroup.createGroup(idx);
      await modelGroup.attrs.setItem("name", classifierModel.name);
      if (+idx > 1) {
        const savedModelInfo = await classifierModel.getSavedModelFiles();
        updateRecordArray(userModels, kindId, {
          modelJson: {
            blob: savedModelInfo.modelJsonBlob,
            fileName: savedModelInfo.modelJsonFileName,
          },
          modelWeights: {
            blob: savedModelInfo.weightsBlob,
            fileName: savedModelInfo.weightsFileName,
          },
        });
      }
      const paramGroup = await modelGroup.createGroup("params");
      await serializeModalParams(paramGroup, modelInfo.params);
    }
  }
  return userModels;
};

const serializeSegmenter = async (
  segmenterGroup: Group,
  segmenter: SegmenterState,
) => {
  const segmenterModel = availableSegmenterModels[segmenter.selectedModelIdx];

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
  const zipStore = new ZipStore(name);
  const root = await group(zipStore, zipStore.rootName);

  // pnpm start/build must be run with VITE_APP_VERSION=$npm_package_version
  const piximiVersion = import.meta.env.VITE_APP_VERSION;

  if (!piximiVersion) {
    throw Error("Missing Piximi version");
  }

  root.attrs.setItem("version", piximiVersion);

  const projectGroup = await root.createGroup("project");
  await _serializeProject(projectGroup, projectSlice, data, loadCb);
  await root.createGroup("classifier");
  // const classifierGroup = await root.createGroup("classifier");
  // const userModels = await serializeClassifier(
  //   classifierGroup,
  //   classifierSlice,
  // );

  const segmenterGroup = await root.createGroup("segmenter");
  await serializeSegmenter(segmenterGroup, segmenterSlice);

  return zipStore.zip;
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

export const writeArray = async (
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

export const writeTensor = async (
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
