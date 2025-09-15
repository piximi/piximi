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
  Category,
  AnnotationObject,
  ImageMetadata,
  ImageData,
} from "store/data/types";
import { range } from "lodash";
import { createColorsTensor } from "utils/tensorUtils";
import {
  METADATA_GROUP_ATTRS,
  IMAGE_GROUP_ATTRS,
  ANNOTATION_GROUP_ATTRS,
  CATEGORY_GROUP_ATTRS,
  KIND_GROUP_ATTRS,
  CLASSIFIER_GROUP_ATTRS,
  SEGMENTER_GROUP_ATTRS,
} from "../enums";

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

const serializeMetadata = async (
  metadataGroup: Group,
  metadata: Array<ImageMetadata>,
  loadCb: LoadCB,
) => {
  const metadataNames = metadata.map((metadatum) => metadatum.name);

  metadataGroup.attrs.setItem(
    METADATA_GROUP_ATTRS.MetadataNames,
    metadataNames,
  );
  loadCb(0, `serializing ${metadata.length} images`);

  for await (const i of range(0, metadata.length)) {
    const metadatum = metadata[i];
    const metadatumGroup = await metadataGroup.createGroup(metadataNames[i]);
    await metadatumGroup.attrs.setItem(METADATA_GROUP_ATTRS.Id, metadatum.id);
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.ImageDataIds,
      metadatum.imageDataIds,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.Kinds,
      metadatum.kind,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.Planes,
      metadatum.shape.planes,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.Channels,
      metadatum.shape.channels,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.Width,
      metadatum.shape.width,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.Height,
      metadatum.shape.height,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.BitDepth,
      metadatum.bitDepth,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.DefaultImageId,
      metadatum.defaultImageId,
    );
    await metadatumGroup.attrs.setItem(
      METADATA_GROUP_ATTRS.TimeSeries,
      metadatum.timeSeries,
    );

    loadCb(
      (i + 1) / metadataNames.length,
      `serialized image ${i + 1}/${metadataNames.length}`,
    );
  }
};

const serializeImageData = async (
  imagesGroup: Group,
  images: Array<ImageData>,
  loadCb: LoadCB,
) => {
  const imageNames = images.map((image) => image.name);

  imagesGroup.attrs.setItem(IMAGE_GROUP_ATTRS.ImageNames, imageNames);
  loadCb(0, `serializing ${images.length} images`);

  for await (const i of range(0, images.length)) {
    const image = images[i];
    const imageGroup = await imagesGroup.createGroup(imageNames[i]);
    await imageGroup.attrs.setItem(IMAGE_GROUP_ATTRS.Id, image.id);
    await imageGroup.attrs.setItem(
      IMAGE_GROUP_ATTRS.MetadataId,
      image.metadataId,
    );
    await imageGroup.attrs.setItem(
      IMAGE_GROUP_ATTRS.ClassifierPartition,
      image.partition,
    );
    await imageGroup.attrs.setItem(
      IMAGE_GROUP_ATTRS.Timepoint,
      image.timepoint,
    );
    await writeFlatTensor(imageGroup, imageNames[i], image.data);

    await imageGroup.attrs.setItem(
      IMAGE_GROUP_ATTRS.ActivePlane,
      image.activePlane,
    );
    await imageGroup.attrs.setItem(
      IMAGE_GROUP_ATTRS.ClassCategoryId,
      image.categoryId,
    );
    const colorGroup = await imageGroup.createGroup("colors");
    const colorTensor = createColorsTensor(image.colors, image.data.shape[3]);
    await serializeImageColors(colorGroup, colorTensor);

    loadCb(
      (i + 1) / imageNames.length,
      `serialized image ${i + 1}/${imageNames.length}`,
    );
  }
};
const serializeAnnotations = async (
  annotationsGroup: Group,
  annotations: Array<AnnotationObject>,
  loadCb: LoadCB,
) => {
  const annotationNames = annotations.map((annotation) => annotation.name);

  annotationsGroup.attrs.setItem(
    ANNOTATION_GROUP_ATTRS.AnnotationNames,
    annotationNames,
  );
  loadCb(0, `serializing ${annotations.length} images`);

  for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i];
    const annotationGroup = await annotationsGroup.createGroup(
      annotationNames[i],
    );
    const data = await writeTensor(
      annotationGroup,
      annotationNames[i],
      annotation.data,
      [
        annotation.shape.planes,
        annotation.shape.height,
        annotation.shape.width,
        annotation.shape.channels,
      ],
    );
    await data.attrs.setItem("bit_depth", annotation.bitDepth);
    // const bd = await getAttr(data, "bit_depth");

    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.Id,
      annotation.id,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.ActivePlane,
      annotation.activePlane,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.ClassCategoryId,
      annotation.categoryId,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.ClassifierPartition,
      annotation.partition,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.Kind,
      annotation.kind,
    );

    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.Bbox,
      annotation.boundingBox,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.Mask,
      annotation.encodedMask,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.ImageId,
      annotation.imageId,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.Plane,
      annotation.encodedMask,
    );
    await annotationGroup.attrs.setItem(
      ANNOTATION_GROUP_ATTRS.Timepoint,
      annotation.imageId,
    );

    loadCb(
      (i + 1) / annotationNames.length,
      `serialized image ${i + 1}/${annotationNames.length}`,
    );
  }
};

const serializeCategories = async (
  categoryGroup: Group,
  categories: Category[],
) => {
  await categoryGroup.attrs.setItem(
    CATEGORY_GROUP_ATTRS.CategoryId,
    categories.map((cat) => cat.id),
  );
  await categoryGroup.attrs.setItem(
    CATEGORY_GROUP_ATTRS.Color,
    categories.map((cat) => cat.color),
  );
  await categoryGroup.attrs.setItem(
    CATEGORY_GROUP_ATTRS.Name,
    categories.map((cat) => cat.name),
  );
  await categoryGroup.attrs.setItem(
    CATEGORY_GROUP_ATTRS.Kind,
    categories.map((cat) => cat.kind),
  );
};
const serializeKinds = async (kindGroup: Group, kinds: Kind[]) => {
  await kindGroup.attrs.setItem(
    KIND_GROUP_ATTRS.KindId,
    kinds.map((k) => k.id),
  );
  await kindGroup.attrs.setItem(
    KIND_GROUP_ATTRS.UnknownCategoryId,
    kinds.map((k) => k.unknownCategoryId),
  );
  await kindGroup.attrs.setItem(
    KIND_GROUP_ATTRS.DisplayName,
    kinds.map((k) => k.displayName),
  );
};

const _serializeProject = async (
  projectGroup: Group,
  project: ProjectState,
  data: {
    kinds: Array<Kind>;
    categories: Array<Category>;
    metadata: Array<ImageMetadata>;
    images: Array<ImageData>;
    annotations: Array<AnnotationObject>;
  },
  loadCb: LoadCB,
) => {
  await projectGroup.attrs.setItem("name", project.name);
  await projectGroup.attrs.setItem(
    "imageChannels",
    project.imageChannels ?? "undefined",
  );

  const metadataGroup = await projectGroup.createGroup("metadata");
  console.log(data.metadata);
  await serializeMetadata(metadataGroup, data.metadata, loadCb);

  const imagesGroup = await projectGroup.createGroup("images");
  await serializeImageData(imagesGroup, data.images, loadCb);

  const annotationsGroup = await projectGroup.createGroup("annotations");
  await serializeAnnotations(annotationsGroup, data.annotations, loadCb);

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
  await classifierGroup.attrs.setItem(
    CLASSIFIER_GROUP_ATTRS.ClassifierKinds,
    classifierKindIds,
  );

  for await (const kindId of classifierKindIds) {
    const kindClassifiersInfo = kindClassifiers[kindId];
    const kindClassifierGroup = await classifierGroup.createGroup(kindId);
    const kindModels = Object.keys(kindClassifiersInfo.modelInfoDict);

    await kindClassifierGroup.attrs.setItem(
      CLASSIFIER_GROUP_ATTRS.Models,
      kindModels,
    );

    for await (const modelName of kindModels) {
      const modelInfo = kindClassifiersInfo.modelInfoDict[modelName];
      const modelGroup = await kindClassifierGroup.createGroup(modelName);

      await modelGroup.attrs.setItem(CLASSIFIER_GROUP_ATTRS.Name, modelName);

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

  await segmenterGroup.attrs.setItem(
    SEGMENTER_GROUP_ATTRS.Name,
    segmenterModel.name,
  );
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
    metadata: Array<ImageMetadata>;
    images: Array<ImageData>;
    annotations: Array<AnnotationObject>;
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
const writeFlatTensor = async (group: Group, name: string, tensor: Tensor) => {
  return writeArray(group, name, cleanBuffer(tensor));
};
