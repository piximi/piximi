import { tensor2d, tensor4d } from "@tensorflow/tfjs";
import semver from "semver";
import { openGroup, Group, ZarrArray } from "zarr";

import { createRenderedTensor, BitDepth } from "./imageHelper";
import {
  Project,
  Classifier,
  AnnotationType,
  Partition,
  Category,
  FitOptions,
  PreprocessOptions,
  CropOptions,
  RescaleOptions,
  CropSchema,
  Metric,
  LossFunction,
  OptimizationAlgorithm,
  ImageType,
  LoadCB,
} from "types";
import { Colors } from "types/tensorflow";
import { initialState as initialClassifierState } from "store/classifier/classifierSlice";
import { initialState as initialProjectState } from "store/project/projectSlice";
import { initialState as initialSegmenterState } from "store/segmenter/segmenterSlice";
import { CustomStore } from "utils/common/zarrStores";
import { RawArray } from "zarr/types/rawArray";

/*
  ====================
  File Deserialization
  ====================
 */

const deserializeAnnotationsGroup = async (
  annotationsGroup: Group
): Promise<Array<AnnotationType>> => {
  const imageIds = (await getAttr(annotationsGroup, "image_id")) as string[];

  const categories = (await getAttr(
    annotationsGroup,
    "annotation_category_id"
  )) as string[];

  const ids = (await getAttr(annotationsGroup, "annotation_id")) as string[];

  const bboxes = await getDatasetSelection(annotationsGroup, "bounding_box", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const maskLengths = await getDatasetSelection(
    annotationsGroup,
    "mask_length",
    [null]
  ).then((ra) => ra.data as Uint8Array);

  const masks = await getDatasetSelection(annotationsGroup, "mask", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const planes = await getDatasetSelection(annotationsGroup, "plane", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  let annotations: Array<AnnotationType> = [];
  let bboxIdx = 0;
  let maskIdx = 0;
  for (let i = 0; i < ids.length; i++) {
    annotations.push({
      id: ids[i],
      categoryId: categories[i],
      plane: planes[i],
      boundingBox: Array.from(bboxes.slice(bboxIdx, bboxIdx + 4)) as [
        number,
        number,
        number,
        number
      ],
      encodedMask: Array.from(masks.slice(maskIdx, maskIdx + maskLengths[i])),
      imageId: imageIds[i],
    });

    bboxIdx += 4;
    maskIdx += maskLengths[i];
  }

  return annotations;
};

const deserializeColorsGroup = async (colorsGroup: Group): Promise<Colors> => {
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

const deserializeImageGroup = async (
  name: string,
  imageGroup: Group
): Promise<ImageType> => {
  const id = (await getAttr(imageGroup, "image_id")) as string;
  const activePlane = (await getAttr(imageGroup, "active_plane")) as number;
  const categoryId = (await getAttr(imageGroup, "class_category_id")) as string;
  const classifierPartition = (await getAttr(
    imageGroup,
    "classifier_partition"
  )) as Partition;

  const colorsGroup = await getGroup(imageGroup, "colors");
  const colors = await deserializeColorsGroup(colorsGroup);
  const imageDataset = await getDataset(imageGroup, name);
  const imageRawArray = (await imageDataset.getRaw()) as RawArray;
  const imageData = imageRawArray.data as Float32Array;
  const [planes, height, width, channels] = imageRawArray.shape;
  const bitDepth = (await getAttr(imageDataset, "bit_depth")) as BitDepth;

  const imageTensor = tensor4d(
    imageData,
    [planes, height, width, channels],
    "float32"
  );
  const src = await createRenderedTensor(
    imageTensor,
    colors,
    bitDepth,
    activePlane
  );

  return {
    id,
    name,
    activePlane,
    categoryId,
    partition: classifierPartition,
    colors,
    data: imageTensor,
    bitDepth,
    shape: {
      planes,
      height,
      width,
      channels,
    },
    src,
    visible: true,
  };
};

const deserializeImagesGroup = async (imagesGroup: Group, loadCb: LoadCB) => {
  const imageNames = (await getAttr(imagesGroup, "image_names")) as string[];

  const images: Array<ImageType> = [];

  for (const [i, name] of Object.entries(imageNames)) {
    // process.env.REACT_APP_LOG_LEVEL === "1" &&
    //   console.log(`deserializing image ${+i + 1}/${imageNames.length}`);

    loadCb(
      +i / (imageNames.length - 1),
      `deserializing image ${+i + 1}/${imageNames.length}`
    );

    const imageGroup = await getGroup(imagesGroup, name);
    const image = await deserializeImageGroup(name, imageGroup);
    images.push(image);
  }

  // final image complete
  loadCb(1, "");

  return images;
};

const deserializeCategoriesGroup = async (
  categoriesGroup: Group
): Promise<Array<Category>> => {
  const ids = (await getAttr(categoriesGroup, "category_id")) as string[];
  const colors = (await getAttr(categoriesGroup, "color")) as string[];
  const names = (await getAttr(categoriesGroup, "name")) as string[];

  if (ids.length !== colors.length || ids.length !== names.length) {
    throw Error(
      `Expected categories group "${categoriesGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`
    );
  }

  const categories: Array<Category> = [];
  for (let i = 0; i < ids.length; i++) {
    categories.push({
      id: ids[i],
      color: colors[i],
      name: names[i],
      visible: true,
    });
  }

  return categories;
};

const deserializeProjectGroup = async (
  projectGroup: Group,
  loadCb: LoadCB
): Promise<{
  project: Project;
  data: {
    images: Array<ImageType>;
    annotations: Array<AnnotationType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  };
}> => {
  const name = (await getAttr(projectGroup, "name")) as string;

  const imagesGroup = await getGroup(projectGroup, "images");
  const images = await deserializeImagesGroup(imagesGroup, loadCb);

  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(annotationsGroup);

  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);

  const annotationCategoriesGroup = await getGroup(
    projectGroup,
    "annotationCategories"
  );
  const annotationCategories = await deserializeCategoriesGroup(
    annotationCategoriesGroup
  );

  return {
    project: {
      ...initialProjectState,
      name,
    },
    data: { images, annotations, categories, annotationCategories },
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

const deserializeClassifierGroup = async (
  classifierGroup: Group
): Promise<Classifier> => {
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

const deserializeSegmenterGroup = async (segmenterGroup: Group) => {
  // present, but not used currently
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const modelName = await getAttr(segmenterGroup, "name");

  // TODO - decode segmenter once encoding scheme developed
  return initialSegmenterState;
};

export const deserialize = async (fileStore: CustomStore, loadCb: LoadCB) => {
  process.env.REACT_APP_LOG_LEVEL === "1" &&
    console.log(`starting deserialization of ${fileStore.rootName}`);

  const rootGroup = await openGroup(fileStore, fileStore.rootName, "r");

  const piximiVersionRaw = (await getAttr(rootGroup, "version")) as string;
  const piximiVersion = semver.clean(piximiVersionRaw);

  if (!semver.valid(piximiVersion) || semver.lt(piximiVersion!, "0.1.0")) {
    throw Error(`File version ${piximiVersion} is unsupported.`);
  }

  const projectGroup = await getGroup(rootGroup, "project");
  const { project, data } = await deserializeProjectGroup(projectGroup, loadCb);

  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await deserializeClassifierGroup(classifierGroup);

  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);

  process.env.REACT_APP_LOG_LEVEL === "1" &&
    console.log(`closed ${fileStore.rootName}`);

  return {
    project,
    classifier,
    data,
    segmenter,
  };
};

/*
  ============================
  File Deserialization Helpers
  ============================
 */

const getDataset = async (root: Group, key: string) => {
  const dataset = await root.getItem(key);

  if (dataset instanceof ZarrArray) {
    return dataset as ZarrArray;
  } else {
    throw Error(`Expected dataset "${key}" in group "${root.path}"`);
  }
};

const getDatasetSelection = async (
  root: Group,
  key: string,
  selection: Array<number | null>
) => {
  const dataset = await root.getItem(key);

  if (dataset instanceof ZarrArray) {
    const rawData = await dataset.getRaw(selection);
    return rawData as RawArray;
  } else {
    throw Error(`Expected dataset "${key}" in group "${root.path}"`);
  }
};

const getAttr = async (root: Group | ZarrArray, attr: string) => {
  const validAttr = await root.attrs.containsItem(attr);

  if (validAttr) {
    const attrValue = await root.attrs.getItem(attr);
    return attrValue;
  } else {
    throw Error(`Expected attribute "${attr}" in group "${root.path}"`);
  }
};

const getGroup = async (root: Group, key: string) => {
  const group = await root.getItem(key);

  if (group instanceof Group) {
    return group as Group;
  } else {
    throw Error(
      `Expected key "${key}" of type "Group" in group "${root.path}"`
    );
  }
};
