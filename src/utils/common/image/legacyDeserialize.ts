import { tensor2d, tensor4d } from "@tensorflow/tfjs";
import { Dataset, File, Group, ready } from "h5wasm";
import semver from "semver";

import { getFile } from "../fileHandlers";
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
} from "types";
import { Colors } from "types/tensorflow";
import { initialState as initialClassifierState } from "store/classifier/classifierSlice";
import { initialState as initialProjectState } from "store/project/projectSlice";
import { initialState as initialSegmenterState } from "store/segmenter/segmenterSlice";

/*
  ====================
  File Deserialization
  ====================
 */

const deserializeAnnotationsGroup = (
  annotationsGroup: Group
): Array<AnnotationType> => {
  const imageIds = getDataset(annotationsGroup, "image_id").value as string[];
  const bboxes = getDataset(annotationsGroup, "bounding_box")
    .value as Uint8Array;
  const categories = getDataset(annotationsGroup, "annotation_category_id")
    .value as string[];
  const ids = getDataset(annotationsGroup, "annotation_id").value as string[];
  const masks = getDataset(annotationsGroup, "mask").value as Uint8Array;
  const maskLengths = getDataset(annotationsGroup, "mask_length")
    .value as Uint8Array;
  const planes = getDataset(annotationsGroup, "plane").value as Uint8Array;

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

const deserializeColorsGroup = (colorsGroup: Group): Colors => {
  const colorsDataset = getDataset(colorsGroup, "color");
  const numChannels = colorsDataset.shape[0];
  const colors = colorsDataset.value as Float32Array;
  const rangeMaxs = getDataset(colorsGroup, "range_max").value as Float32Array;
  const rangeMins = getDataset(colorsGroup, "range_min").value as Float32Array;
  const visibilities = getDataset(colorsGroup, "visible_B").value as Uint8Array;

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
  const id = getAttr(imageGroup, "image_id") as string;
  const activePlane = getAttr(imageGroup, "active_plane") as number;
  const categoryId = getAttr(imageGroup, "class_category_id") as string;
  const classifierPartition = getAttr(
    imageGroup,
    "classifier_partition"
  ) as Partition;

  const colorsGroup = getGroup(imageGroup, "colors");
  const colors = deserializeColorsGroup(colorsGroup);
  const imageDataset = getDataset(imageGroup, name);
  const imageData = imageDataset.value as Float32Array;
  const [planes, height, width, channels] = imageDataset.shape;
  const bitDepth = getAttr(imageDataset, "bit_depth") as BitDepth;

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

const deserializeImagesGroup = async (imagesGroup: Group) => {
  const imageNames = imagesGroup.keys();
  const images: Array<ImageType> = [];

  for (const [i, name] of Object.entries(imageNames)) {
    process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.log(`processing image ${i}/${imageNames.length}`);

    let imageGroup = getGroup(imagesGroup, name);
    let image = await deserializeImageGroup(name, imageGroup);
    images.push(image);
  }

  return images;
};

const deserializeCategoriesGroup = (categoriesGroup: Group) => {
  const ids = getDataset(categoriesGroup, "category_id").value as string[];
  const colors = getDataset(categoriesGroup, "color").value as string[];
  const names = getDataset(categoriesGroup, "name").value as string[];

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
  projectGroup: Group
): Promise<{
  project: Project;
  data: {
    images: Array<ImageType>;
    annotations: Array<AnnotationType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  };
}> => {
  const name = getAttr(projectGroup, "name") as string;

  const imagesGroup = getGroup(projectGroup, "images");
  const images = await deserializeImagesGroup(imagesGroup);

  const annotationsGroup = getGroup(projectGroup, "annotations");
  const annotations = deserializeAnnotationsGroup(annotationsGroup);

  const categoriesGroup = getGroup(projectGroup, "categories");
  const categories = deserializeCategoriesGroup(categoriesGroup);

  const annotationCategoriesGroup = getGroup(
    projectGroup,
    "annotationCategories"
  );
  const annotationCategories = deserializeCategoriesGroup(
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deserializeModelPropsGroup = (modelPropsGroup: Group) => {
  const classifierName = getAttr(modelPropsGroup, "classifier_name") as string;
  const segmenterName = getAttr(modelPropsGroup, "segmenter_name") as string;

  return { classifierName, segmenterName };
};

const deserializeFitOptionsGroup = (fitOptionsGroup: Group): FitOptions => {
  const batchSize = getAttr(fitOptionsGroup, "batch_size") as number;
  const epochs = getAttr(fitOptionsGroup, "epochs") as number;

  return {
    batchSize,
    epochs,
  };
};

const deserializeCropOptionsGroup = (cropOptionsGroup: Group): CropOptions => {
  const cropSchema = getAttr(
    cropOptionsGroup,
    "crop_schema"
  ) as string as CropSchema;
  const numCrops = getAttr(cropOptionsGroup, "num_crops") as number;

  return { cropSchema, numCrops };
};

const deserializeRescaleOptionsGroup = (
  rescaleOptionsGroup: Group
): RescaleOptions => {
  const center = Boolean(getAttr(rescaleOptionsGroup, "center_B") as number);
  const rescale = Boolean(getAttr(rescaleOptionsGroup, "rescale_B") as number);

  return { center, rescale };
};

const deserializePreprocessOptionsGroup = (
  preprocessOptionsGroup: Group
): PreprocessOptions => {
  const shuffle = Boolean(
    getAttr(preprocessOptionsGroup, "shuffle_B") as number
  );

  const cropOptionsGroup = getGroup(preprocessOptionsGroup, "crop_options");
  const cropOptions = deserializeCropOptionsGroup(cropOptionsGroup);

  const rescaleOptionsGroup = getGroup(
    preprocessOptionsGroup,
    "rescale_options"
  );
  const rescaleOptions = deserializeRescaleOptionsGroup(rescaleOptionsGroup);

  return { cropOptions, rescaleOptions, shuffle };
};

const deserializeClassifierGroup = (classifierGroup: Group): Classifier => {
  // round to account for serialization error
  // convert to number
  const learningRate = +(
    getAttr(classifierGroup, "learning_rate") as number
  ).toFixed(4);
  const lossFunction = getAttr(
    classifierGroup,
    "loss_function"
  ) as string as LossFunction;
  const optimizationAlgorithm = getAttr(
    classifierGroup,
    "optimization_algorithm"
  ) as string as OptimizationAlgorithm;
  // round to account for serialization error
  // convert to number
  const trainingPercentage = +(
    getAttr(classifierGroup, "training_percent") as number
  ).toFixed(2);

  const fitOptionsGroup = getGroup(classifierGroup, "fit_options");
  const fitOptions = deserializeFitOptionsGroup(fitOptionsGroup);

  const inputShape = getDataset(classifierGroup, "input_shape")
    .value as Uint8Array;
  const [planes, height, width, channels] = inputShape;
  const metrics = getDataset(classifierGroup, "metrics")
    .value as string[] as Metric[];

  const preprocessOptionsGroup = getGroup(
    classifierGroup,
    "preprocess_options"
  );
  const preprocessOptions = deserializePreprocessOptionsGroup(
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

export const deserialize = async (filename: string) => {
  const { FS } = await ready;

  process.env.REACT_APP_LOG_LEVEL === "1" &&
    console.log(`starting deserialization of ${filename}`);

  let f = await getFile(filename, "r");

  if (!(f.type === "Group")) {
    throw Error("Expected group at top level");
  }

  const piximiVersion = semver.clean(getAttr(f, "version") as string);

  if (!semver.valid(piximiVersion) || semver.lt(piximiVersion!, "0.1.0")) {
    throw Error(`File version ${piximiVersion} is unsupported.`);
  }

  const projectGroup = getGroup(f, "project");
  const { project, data } = await deserializeProjectGroup(projectGroup);

  // exists, but we do nothing with them, only for the user to inspect
  // const modelPropsGroup = getGroup(f, "model_props");
  // const { classifierName, segmenterName } = deserializeModelPropsGroup(modelPropsGroup);

  const classifierGroup = getGroup(f, "classifier");
  const classifier = deserializeClassifierGroup(classifierGroup);

  const status = f.close();
  process.env.REACT_APP_LOG_LEVEL === "1" &&
    console.log(`closed ${filename} with status ${status}`);

  FS.unlink(`${f.path}${f.filename}`);

  return {
    project,
    classifier,
    data,
    segmenter: initialSegmenterState,
  };
};

/*
  ============================
  File Deserialization Helpers
  ============================
 */

const getDataset = (root: File | Group, key: string) => {
  const dataset = root.get(key);

  if (dataset && dataset.type === "Dataset") {
    return dataset as Dataset;
  } else {
    throw Error(`Expected dataset "${key}" in group "${root.path}"`);
  }
};

const getAttr = (root: File | Group | Dataset, attr: string) => {
  if (root.attrs.hasOwnProperty(attr)) {
    return root.attrs[attr].value;
  } else {
    throw Error(`Expected attribute "${attr}" in group "${root.path}"`);
  }
};

const getGroup = (root: File | Group, key: string) => {
  const group = root.get(key);

  if (group && group.type === "Group") {
    return group as Group;
  } else {
    throw Error(
      `Expected key "${key}" of type "Group" in group "${root.path}"`
    );
  }
};
