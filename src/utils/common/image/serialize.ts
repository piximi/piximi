import { Group, ready } from "h5wasm";

import { getFile, to_blob } from "../fileHandlers";
import {
  AnnotationType,
  Classifier,
  FitOptions,
  PreprocessOptions,
  Project,
  Category,
  ImageType,
  SegmenterStoreType,
} from "types";
import { Colors } from "types/tensorflow";
import {
  availableClassifierModels,
  availableSegmenterModels,
} from "types/ModelType";

/* 
   =====================
   Project Serialization
   =====================
 */

const serializeImageAnnotations = (
  annotationsGroup: Group,
  annotations: Array<AnnotationType>
) => {
  const imageIds = annotations.map((an) => an.imageId);
  const bboxes = new Uint8Array(annotations.length * 4);
  const categories = annotations.map((an) => an.categoryId);
  const ids = annotations.map((an) => an.id);
  const maskLengths = new Uint8Array(annotations.length);
  const masks = new Uint8Array(
    annotations.reduce((prev, curr) => prev + curr.encodedMask.length, 0)
  );
  const planes = Uint8Array.from(annotations.map((an) => an.plane));

  let maskStartIdx = 0;
  for (let i = 0; i < annotations.length; i++) {
    let annotation = annotations[i];
    bboxes.set(annotation.boundingBox, i * 4);
    maskLengths[i] = annotation.encodedMask.length;
    masks.set(annotation.encodedMask, maskStartIdx);
    maskStartIdx += annotation.encodedMask.length;
  }

  annotationsGroup.create_dataset("image_id", imageIds);
  annotationsGroup.create_dataset("bounding_box", bboxes, undefined, "<B");
  annotationsGroup.create_dataset("annotation_category_id", categories);
  annotationsGroup.create_dataset("annotation_id", ids);
  annotationsGroup.create_dataset("mask_length", maskLengths, undefined, "<B");
  annotationsGroup.create_dataset("mask", masks, undefined, "<B");
  annotationsGroup.create_dataset("plane", planes, undefined, "<B");
};

const serializeImageColors = (colorsGroup: Group, colors: Colors) => {
  const numChannels = colors.color.shape[0];
  const rangeMins = new Float32Array(numChannels);
  const rangeMaxs = new Float32Array(numChannels);
  const visibilities = new Uint8Array(numChannels);

  for (let i = 0; i < numChannels; i++) {
    rangeMins[i] = colors.range[i][0];
    rangeMaxs[i] = colors.range[i][1];
    visibilities[i] = Number(colors.visible[i]);
  }

  colorsGroup.create_dataset("range_min", rangeMins, undefined, "<f4");
  colorsGroup.create_dataset("range_max", rangeMaxs, undefined, "<f4");
  colorsGroup.create_dataset("visible_B", visibilities, undefined, "<B");

  colorsGroup.create_dataset(
    "color",
    colors.color.dataSync(),
    [colors.color.shape[0], colors.color.shape[1]],
    "<f4"
  );
};

const serializeImages = (imagesGroup: Group, images: Array<ImageType>) => {
  for (let i = 0; i < images.length; i++) {
    let im = images[i];
    let imGroup = imagesGroup.create_group(im.name);

    let im_data = imGroup.create_dataset(
      im.name,
      im.data.dataSync(),
      [im.shape.planes, im.shape.height, im.shape.width, im.shape.channels],
      "<f4"
    );
    im_data.create_attribute("bit_depth", im.bitDepth, undefined, "<B");

    imGroup.create_attribute("image_id", im.id);
    imGroup.create_attribute("active_plane", im.activePlane, undefined, "<B");
    imGroup.create_attribute("class_category_id", im.categoryId);
    imGroup.create_attribute("classifier_partition", im.partition);
    // imGroup.create_attribute("segmenter_partition", im.segmentationPartition)

    let colorGroup = imGroup.create_group("colors");
    serializeImageColors(colorGroup, im.colors);
  }
};

const serializeCategories = (categoryGroup: Group, categories: Category[]) => {
  categoryGroup.create_dataset(
    "category_id",
    categories.map((cat) => cat.id)
  );
  categoryGroup.create_dataset(
    "color",
    categories.map((cat) => cat.color)
  );
  categoryGroup.create_dataset(
    "name",
    categories.map((cat) => cat.name)
  );
};

const serializeProject = (
  projectGroup: Group,
  project: Project,
  data: {
    images: Array<ImageType>;
    annotations: Array<AnnotationType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  }
) => {
  projectGroup.create_attribute("name", project.name);

  const imagesGroup = projectGroup.create_group("images");
  serializeImages(imagesGroup, data.images);

  let annotationsGroup = projectGroup.create_group("annotations");
  serializeImageAnnotations(annotationsGroup, data.annotations);

  const categoriesGroup = projectGroup.create_group("categories");
  serializeCategories(categoriesGroup, data.categories);
  const annotationCategoriesGroup = projectGroup.create_group(
    "annotationCategories"
  );
  serializeCategories(annotationCategoriesGroup, data.annotationCategories);
};

/*
  ========================
  Classifier Serialization
  ========================
 */

const serializeFitOptions = (
  fitOptionsGroup: Group,
  fitOptions: FitOptions
) => {
  fitOptionsGroup.create_attribute(
    "epochs",
    fitOptions.epochs,
    undefined,
    "<B"
  );
  fitOptionsGroup.create_attribute(
    "batch_size",
    fitOptions.batchSize,
    undefined,
    "<B"
  );
  fitOptionsGroup.create_attribute(
    "initial_epoch",
    fitOptions.initialEpoch,
    undefined,
    "<B"
  );
};

const serializePreprocessOptions = (
  preprocessOptionsGroup: Group,
  preprocessOptions: PreprocessOptions
) => {
  preprocessOptionsGroup.create_attribute(
    "shuffle_B",
    Number(preprocessOptions.shuffle),
    undefined,
    "<B"
  );

  const rescaleOptionsGroup =
    preprocessOptionsGroup.create_group("rescale_options");
  rescaleOptionsGroup.create_attribute(
    "rescale_B",
    Number(preprocessOptions.rescaleOptions.rescale),
    undefined,
    "<B"
  );
  rescaleOptionsGroup.create_attribute(
    "center_B",
    Number(preprocessOptions.rescaleOptions.center),
    undefined,
    "<B"
  );

  const cropOptionsGroup = preprocessOptionsGroup.create_group("crop_options");
  cropOptionsGroup.create_attribute(
    "num_crops",
    preprocessOptions.cropOptions.numCrops,
    undefined,
    "<B"
  );
  cropOptionsGroup.create_attribute(
    "crop_schema",
    preprocessOptions.cropOptions.cropSchema
  );
};

const serializeModelProps = (
  modelPropsGroup: Group,
  classifierName: string,
  segmenterName: string
) => {
  modelPropsGroup.create_attribute("classifier_name", classifierName);
  modelPropsGroup.create_attribute("segmenter_name", segmenterName);
};

const serializeClassifier = (
  classifierGroup: Group,
  classifier: Classifier
) => {
  const fitOptionsGroup = classifierGroup.create_group("fit_options");
  serializeFitOptions(fitOptionsGroup, classifier.fitOptions);

  const { planes, height, width, channels } = classifier.inputShape;
  classifierGroup.create_dataset(
    "input_shape",
    new Uint8Array([planes, height, width, channels]),
    undefined,
    "<B"
  );

  classifierGroup.create_attribute(
    "learning_rate",
    classifier.learningRate,
    undefined,
    "<f"
  );

  classifierGroup.create_attribute("loss_function", classifier.lossFunction);

  classifierGroup.create_attribute(
    "optimization_algorithm",
    classifier.optimizationAlgorithm
  );

  classifierGroup.create_attribute(
    "training_percent",
    classifier.trainingPercentage,
    undefined,
    "<f"
  );

  const preprocessOptionsGroup =
    classifierGroup.create_group("preprocess_options");
  serializePreprocessOptions(
    preprocessOptionsGroup,
    classifier.preprocessOptions
  );

  classifierGroup.create_dataset("metrics", classifier.metrics);
};

/*
  ===========
  Entry Point
  ===========
 */

export const serialize = async (
  name: string,
  projectSlice: Project,
  data: {
    images: Array<ImageType>;
    annotations: Array<AnnotationType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  },
  classifierSlice: Classifier,
  segmenterSlice: SegmenterStoreType
) => {
  const { FS } = await ready;

  const f = await getFile(name, "w");

  // yarn/npm start/build must be run with REACT_APP_VERSION=$npm_package_version
  const piximiVersion = process.env.REACT_APP_VERSION;

  if (!piximiVersion) {
    throw Error("Missing Piximi version");
  }

  f.create_attribute("version", piximiVersion);

  const projectGroup = f.create_group("project");
  serializeProject(projectGroup, projectSlice, data);

  const modelPropsGroup = f.create_group("model_props");
  const classifierModel =
    availableClassifierModels[classifierSlice.selectedModelIdx];
  const segmenterModel =
    availableSegmenterModels[segmenterSlice.selectedModelIdx];
  serializeModelProps(
    modelPropsGroup,
    classifierModel.name,
    segmenterModel.name
  );

  const classifierGroup = f.create_group("classifier");
  serializeClassifier(classifierGroup, classifierSlice);

  const fBlob = await to_blob(f);

  const closeStatus = f.close();

  process.env.REACT_APP_LOG_LEVEL === "1" &&
    console.log(`closed ${name} with status ${closeStatus}`);

  FS.unlink(`${f.path}${f.filename}`);

  return fBlob;
};
