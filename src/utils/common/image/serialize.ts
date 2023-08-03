import { Group, NestedArray, group } from "zarr";
//import { Blosc } from "numcodecs";

// TODO - zarr: no more
//import { to_blob } from "../fileHandlers";
import {
  AnnotationType,
  Classifier,
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
import { ZipStore } from "utils/annotator/file-io/zarr";
import { Tensor } from "@tensorflow/tfjs";

/* 
   =====================
   Project Serialization
   =====================
 */

const serializeImageAnnotations = async (
  annotationsGroup: Group,
  annotations: Array<AnnotationType>
) => {
  const imageIds = annotations.map((an) => an.imageId);
  // Uint16 means images with a width and/or height > 65536 would cause trouble
  const bboxes = new Uint16Array(annotations.length * 4);
  const categories = annotations.map((an) => an.categoryId);
  const ids = annotations.map((an) => an.id);
  // might be able to scale down to Uint16 but better safe in this case
  const maskLengths = new Uint32Array(annotations.length);
  // needs to be Uint32, Uint16Array would potentially start causing
  // trouble on image sizes > 256 x 256 since we're counting pixels
  // and sqrt(2^16) = 256, wheras sqrt(2^32) = 65536 gives us support
  // for decently large images
  const masks = new Uint32Array(
    annotations.reduce((prev, curr) => prev + curr.encodedMask.length, 0)
  );
  // Uint16 because they may have more than 256 planes but more than
  // 65536 is crazy
  const planes = Uint16Array.from(annotations.map((an) => an.plane));

  let maskStartIdx = 0;
  for (let i = 0; i < annotations.length; i++) {
    let annotation = annotations[i];
    bboxes.set(annotation.boundingBox, i * 4);
    maskLengths[i] = annotation.encodedMask.length;
    masks.set(annotation.encodedMask, maskStartIdx);
    maskStartIdx += annotation.encodedMask.length;
  }

  await annotationsGroup.attrs.setItem("image_id", imageIds);
  await annotationsGroup.attrs.setItem("annotation_category_id", categories);
  await annotationsGroup.attrs.setItem("annotation_id", ids);

  await writeArray(annotationsGroup, "bounding_box", bboxes);
  await writeArray(annotationsGroup, "mask_length", maskLengths);
  await writeArray(annotationsGroup, "mask", masks);
  await writeArray(annotationsGroup, "plane", planes);
};

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

const serializeImages = async (
  imagesGroup: Group,
  images: Array<ImageType>
) => {
  // TODO - zarr: split is temporary, replace with just im.name when done
  // const imageNames = images.map((image) => image.name.split(".")[0]);
  const imageNames = images.map((image) => image.name);
  // zarr decoder needs to know the name of each subgroup, so put it as attr
  imagesGroup.attrs.setItem("image_names", imageNames);

  for (let i = 0; i < images.length; i++) {
    process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.log(`serializing image ${+i + 1}/${imageNames.length}`);

    let im = images[i];
    let imGroup = await imagesGroup.createGroup(imageNames[i]);

    let im_data = await writeTensor(imGroup, imageNames[i], im.data, [
      im.shape.planes,
      im.shape.height,
      im.shape.width,
      im.shape.channels,
    ]);

    await im_data.attrs.setItem("bit_depth", im.bitDepth);

    await imGroup.attrs.setItem("image_id", im.id);
    await imGroup.attrs.setItem("active_plane", im.activePlane);
    await imGroup.attrs.setItem("class_category_id", im.categoryId);
    await imGroup.attrs.setItem("classifier_partition", im.partition);
    // imGroup.attrs.setItem("segmenter_partition", im.segmentationPartition)

    let colorGroup = await imGroup.createGroup("colors");
    await serializeImageColors(colorGroup, im.colors);
  }
};

const serializeCategories = async (
  categoryGroup: Group,
  categories: Category[]
) => {
  await categoryGroup.attrs.setItem(
    "category_id",
    categories.map((cat) => cat.id)
  );
  await categoryGroup.attrs.setItem(
    "color",
    categories.map((cat) => cat.color)
  );
  await categoryGroup.attrs.setItem(
    "name",
    categories.map((cat) => cat.name)
  );
};

const serializeProject = async (
  projectGroup: Group,
  project: Project,
  data: {
    images: Array<ImageType>;
    annotations: Array<AnnotationType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  }
) => {
  await projectGroup.attrs.setItem("name", project.name);

  const imagesGroup = await projectGroup.createGroup("images");

  await serializeImages(imagesGroup, data.images);

  let annotationsGroup = await projectGroup.createGroup("annotations");
  await serializeImageAnnotations(annotationsGroup, data.annotations);

  const categoriesGroup = await projectGroup.createGroup("categories");
  await serializeCategories(categoriesGroup, data.categories);
  const annotationCategoriesGroup = await projectGroup.createGroup(
    "annotationCategories"
  );
  await serializeCategories(
    annotationCategoriesGroup,
    data.annotationCategories
  );
};

/*
  ========================
  Classifier Serialization
  ========================
 */

const serializePreprocessOptions = async (
  preprocessOptionsGroup: Group,
  preprocessOptions: PreprocessOptions
) => {
  await preprocessOptionsGroup.attrs.setItem(
    "shuffle_B",
    Number(preprocessOptions.shuffle)
  );

  const rescaleOptionsGroup = await preprocessOptionsGroup.createGroup(
    "rescale_options"
  );

  await rescaleOptionsGroup.attrs.setItem(
    "rescale_B",
    Number(preprocessOptions.rescaleOptions.rescale)
  );

  await rescaleOptionsGroup.attrs.setItem(
    "center_B",
    Number(preprocessOptions.rescaleOptions.center)
  );

  const cropOptionsGroup = await preprocessOptionsGroup.createGroup(
    "crop_options"
  );
  await cropOptionsGroup.attrs.setItem(
    "num_crops",
    preprocessOptions.cropOptions.numCrops
  );
  await cropOptionsGroup.attrs.setItem(
    "crop_schema",
    preprocessOptions.cropOptions.cropSchema
  );
};

const serializeClassifier = async (
  classifierGroup: Group,
  classifier: Classifier
) => {
  const classifierModel =
    availableClassifierModels[classifier.selectedModelIdx];

  await classifierGroup.attrs.setItem("name", classifierModel.name);

  const { planes, height, width, channels } = classifier.inputShape;
  await writeArray(
    classifierGroup,
    "input_shape",
    new Uint8Array([planes, height, width, channels])
  );

  await classifierGroup.attrs.setItem(
    "training_percent",
    classifier.trainingPercentage
  );

  await classifierGroup.attrs.setItem("metrics", classifier.metrics);

  const optSettingsGroup = await classifierGroup.createGroup(
    "optimizer_settings"
  );

  await optSettingsGroup.attrs.setItem("epochs", classifier.fitOptions.epochs);

  await optSettingsGroup.attrs.setItem(
    "batch_size",
    classifier.fitOptions.batchSize
  );

  await optSettingsGroup.attrs.setItem(
    "optimization_algorithm",
    classifier.optimizationAlgorithm
  );

  await optSettingsGroup.attrs.setItem(
    "learning_rate",
    classifier.learningRate
  );

  await optSettingsGroup.attrs.setItem(
    "loss_function",
    classifier.lossFunction
  );

  const preprocessOptionsGroup = await classifierGroup.createGroup(
    "preprocess_options"
  );
  await serializePreprocessOptions(
    preprocessOptionsGroup,
    classifier.preprocessOptions
  );
};

const serializeSegmenter = async (
  segmenterGroup: Group,
  segmenter: SegmenterStoreType
) => {
  const segmenterModel = availableSegmenterModels[segmenter.selectedModelIdx];

  await segmenterGroup.attrs.setItem("name", segmenterModel.name);
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
  const zipStore = new ZipStore(name);
  const root = await group(zipStore, zipStore.name);

  // yarn/npm start/build must be run with REACT_APP_VERSION=$npm_package_version
  const piximiVersion = process.env.REACT_APP_VERSION;

  if (!piximiVersion) {
    throw Error("Missing Piximi version");
  }

  root.attrs.setItem("version", piximiVersion);

  const projectGroup = await root.createGroup("project");
  await serializeProject(projectGroup, projectSlice, data);

  const classifierGroup = await root.createGroup("classifier");
  await serializeClassifier(classifierGroup, classifierSlice);

  const segmenterGroup = await root.createGroup("segmenter");
  await serializeSegmenter(segmenterGroup, segmenterSlice);

  // TODO - zarr: no
  // const fBlob = await to_blob(f);

  // const closeStatus = f.close();

  // process.env.REACT_APP_LOG_LEVEL === "1" &&
  //   console.log(`closed ${name} with status ${closeStatus}`);

  // FS.unlink(`${f.path}${f.filename}`);

  // return fBlob;
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

const writeArray = async (
  group: Group,
  name: string,
  value: Float32Array | Uint8Array | Int32Array | Uint16Array | Uint32Array,
  shape?: number[]
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
  shape?: number[]
) => {
  return writeArray(
    group,
    name,
    cleanBuffer(tensor),
    shape ? shape : tensor.shape
  );
};
