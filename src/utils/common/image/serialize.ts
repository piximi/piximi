import { Group, ready } from "h5wasm";

import { getFile, to_blob } from "../fileHandlers";
import {
  AnnotationType,
  Classifier,
  FitOptions,
  OldImageType,
  PreprocessOptions,
  Project,
  Category,
} from "types";
import { Colors } from "types/tensorflow";
import { sortTypeByKey } from "types/ImageSortType";
import { Model } from "../models/Model";

/* 
   =====================
   Project Serialization
   =====================
 */

const serializeImageAnnotations = (
  annotationsGroup: Group,
  annotations: Array<AnnotationType>
) => {
  const bboxes = new Uint8Array(annotations.length * 4);
  const categories = annotations.map((an) => an.categoryId);
  const ids = annotations.map((an) => an.id);
  const maskLengths = new Uint8Array(annotations.length);
  const masks = new Uint8Array(
    annotations.reduce((prev, curr) => prev + curr.mask!.length, 0)
  );
  const planes = Uint8Array.from(annotations.map((an) => an.plane));

  let maskStartIdx = 0;
  for (let i = 0; i < annotations.length; i++) {
    let annotation = annotations[i];
    bboxes.set(annotation.boundingBox, i * 4);
    maskLengths[i] = annotation.mask!.length;
    masks.set(annotation.mask!, maskStartIdx);
    maskStartIdx += annotation.mask!.length;
  }

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

const serializeImages = (imagesGroup: Group, images: Array<OldImageType>) => {
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
    imGroup.create_attribute("visible_B", Number(im.visible), undefined, "<B");
    imGroup.create_attribute("classifier_partition", im.partition);
    // imGroup.create_attribute("segmenter_partition", im.segmentationPartition)

    let colorGroup = imGroup.create_group("colors");
    serializeImageColors(colorGroup, im.colors);

    let annotationsGroup = imGroup.create_group("annotations");
    serializeImageAnnotations(annotationsGroup, im.annotations);
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
  categoryGroup.create_dataset(
    "visible_B",
    Uint8Array.from(categories.map((cat) => Number(cat.visible))),
    undefined,
    "<B"
  );
};

const serializeProject = (
  projectGroup: Group,
  project: Project,
  data: {
    images: Array<OldImageType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  }
) => {
  projectGroup.create_attribute("name", project.name);

  const imagesGroup = projectGroup.create_group("images");
  const imageSortKeyName = sortTypeByKey(project.imageSortKey).imageSortKeyName;
  imagesGroup.create_attribute("sort_key", imageSortKeyName);
  serializeImages(imagesGroup, data.images);

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

const serializeModelProps = (modelPropsGroup: Group, model: Model) => {
  modelPropsGroup.create_attribute("model_name", model.name);

  modelPropsGroup.create_attribute("model_tak", model.task);

  modelPropsGroup.create_attribute("src", model.src);

  modelPropsGroup.create_attribute(
    "model_graph_B",
    Number(model.graph),
    undefined,
    "<B"
  );

  modelPropsGroup.create_attribute(
    "model_pretrained_B",
    Number(model.pretrained),
    undefined,
    "<B"
  );

  model.requiredChannels &&
    modelPropsGroup.create_attribute(
      "required_channels",
      model.requiredChannels,
      undefined,
      "<B"
    );
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

  const selectedModelGroup = classifierGroup.create_group("selected_model");
  serializeModelProps(selectedModelGroup, classifier.selectedModel);
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
    images: Array<OldImageType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  },
  classifierSlice: Classifier
) => {
  const { FS } = await ready;

  const f = await getFile(name, "w");

  f.create_attribute("version", "0.1.0");

  const projectGroup = f.create_group("project");
  serializeProject(projectGroup, projectSlice, data);

  const classifierGroup = f.create_group("classifier");
  serializeClassifier(classifierGroup, classifierSlice);

  const fBlob = await to_blob(f);

  const closeStatus = f.close();

  process.env.REACT_APP_LOG_LEVEL === "1" &&
    console.log(`closed ${name} with status ${closeStatus}`);

  FS.unlink(`${f.path}${f.filename}`);

  return fBlob;
};
