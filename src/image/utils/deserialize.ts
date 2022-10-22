import { tensor2d, tensor4d } from "@tensorflow/tfjs";
import * as ImageJS from "image-js"; // TODO: image_data
import { Dataset, File, Group } from "h5wasm";
import _ from "lodash";

import { convertToImage, createRenderedTensor } from "image/utils/imageHelper";
import {
  SerializedImageType,
  ImageType,
  Project,
  Classifier,
  AnnotationType,
} from "types";
import { _SerializedImageType } from "types/SerializedImageType"; // TODO: immge_data

/*
  =====================
  Image Deserialization
  =====================
*/

// TODO: image_data
const _convertSerialization = async (image: _SerializedImageType) => {
  let imageStack: ImageJS.Image[] = [];
  let imageBitDepth = 0;

  for (const plane of image.imageData) {
    for (const src of plane) {
      let im = await ImageJS.Image.load(src, {
        ignorePalette: true,
      });

      if (imageBitDepth === 0) {
        imageBitDepth = im.bitDepth;
      }

      //@ts-ignore
      im.colorModel = "GREY";

      if (im.components > 1) {
        im = im.combineChannels();
      }

      const checks = [
        im.width === image.imageWidth,
        im.height === image.imageHeight,
        im.components === 1,
        im.channels === 1,
        im.bitDepth === imageBitDepth,
        im.alpha === 0,
        im.colorModel === "GREY",
      ];

      if (!_.every(checks)) {
        console.log("BAD src -> image CONVERSION!!!!!)");
        throw Error("BAD THING!!!!");
      }

      imageStack.push(im);
    }
  }

  let convertedImage = await convertToImage(
    new ImageJS.Stack(imageStack),
    image.imageFilename,
    undefined,
    1,
    image.imageChannels
  );

  const checks = [
    convertedImage.shape.width === image.imageWidth,
    convertedImage.shape.height === image.imageHeight,
    convertedImage.shape.channels === image.imageChannels,
    convertedImage.shape.planes === image.imagePlanes,
    convertedImage.bitDepth === imageBitDepth,
    convertedImage.name === image.imageFilename,
    convertedImage.shape.channels === imageStack.length,
  ];

  if (!_.every(checks)) {
    console.log("BAD image -> tensor CONVERSION!!!!!");
    throw Error("BAD THING!!!!");
  }

  return {
    name: convertedImage.name,
    id: image.imageId,
    shape: convertedImage.shape,
    data: convertedImage.data,
    bitDepth: convertedImage.bitDepth,
    colors: convertedImage.colors,
    partition: image.imagePartition,
    categoryId: image.imageCategoryId,
    annotations: image.annotations,

    visible: convertedImage.visible,
    activePlane: convertedImage.activePlane,
    src: convertedImage.src,
  } as ImageType;
};

export const deserializeImage = async (
  serializedImage: SerializedImageType
) => {
  const imageData = tensor4d(serializedImage.data);
  const imageColors = {
    ...serializedImage.colors,
    color: tensor2d(serializedImage.colors.color),
  };

  return {
    name: serializedImage.name,
    id: serializedImage.id,
    shape: {
      planes: serializedImage.planes,
      height: serializedImage.height,
      width: serializedImage.width,
      channels: serializedImage.channels,
    },
    data: imageData,
    bitDepth: serializedImage.bitDepth,
    colors: imageColors,
    partition: serializedImage.partition,
    categoryId: serializedImage.categoryId,
    annotations: serializedImage.annotations,

    visible: true,
    activePlane: 0,
    src:
      serializedImage.src ??
      createRenderedTensor(
        imageData,
        imageColors,
        serializedImage.bitDepth,
        undefined,
        0
      ),
  } as ImageType;
};

export const deserializeImages = async (
  serializedImages: Array<_SerializedImageType>
) => {
  const deserializedImages: Array<ImageType> = [];

  for (const serializedImage of serializedImages) {
    // TODO: image_data - refactor this if/else block once done
    let deserializedImage: ImageType;
    if (serializedImage.imageData !== undefined) {
      deserializedImage = await _convertSerialization(serializedImage);
      deserializedImages.push(deserializedImage);
    } else {
      deserializedImage = await deserializeImage(
        serializedImage as unknown as SerializedImageType
      );
      deserializedImages.push(deserializedImage);
    }
  }
  return deserializedImages;
};

/*
  ====================
  File Deserialization
  ====================
 */

const deserializeAnnotationsGroup = (
  annotationsGroup: Group
): Array<AnnotationType> => {
  const bboxes = getDataset(annotationsGroup, "bounding_box")
    .value as Uint8Array;
  const categories = getDataset(annotationsGroup, "category").value as string[];
  const ids = getDataset(annotationsGroup, "id").value as string[];
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
      mask: Array.from(masks.slice(maskIdx, maskIdx + maskLengths[i])),
    });

    bboxIdx += 4;
    maskIdx += maskLengths[i];
  }

  /*
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
  plane: number;
  */

  return "" as unknown as Array<AnnotationType>;
};

const deserializeImageGroup = (name: string, imageGroup: Group): ImageType => {
  const id = getAttr(imageGroup, "id");
  const activePlane = getAttr(imageGroup, "active_plane");
  const categoryId = getAttr(imageGroup, "category_id");
  const classifierPartition = getAttr(imageGroup, "classifier_partition");
  const visible = Boolean(getAttr(imageGroup, "visible_B"));

  const annotationsGroup = getGroup(imageGroup, "annotations");
  const annotations = deserializeAnnotationsGroup(annotationsGroup);
  // const colorsGroup = getGroup(imageGroup, 'colors');
  // const imageDataset = getDataset(imageGroup, name);

  return "" as unknown as ImageType;
};

const deserializeImagesGroup = (imagesGroup: Group): Array<ImageType> => {
  const sortKey = getAttr(imagesGroup, "sort_key");

  const imageNames = imagesGroup.keys();
  const images: Array<ImageType> = [];
  for (const name of imageNames) {
    let imageGroup = getGroup(imagesGroup, name);
    images.push(deserializeImageGroup(name, imageGroup));
  }

  return images;
};

const deserializeProjectGroup = (projectGroup: Group): Project => {
  const name = getAttr(projectGroup, "name");

  const imagesGroup = getGroup(projectGroup, "images");
  const images = deserializeImagesGroup(imagesGroup);

  // const categoriesGroup = getGroup(projectGroup, "categories");
  // const categories = deserializeCategoriesGroup(categoriesGroup);

  // const annotationCategoriesGroup = getGroup(projectGroup, "annotationCategories");
  // const annotationCategories = deserializeAnnotationCategories(annotationCategoriesGroup);

  return "" as unknown as Project;
};

// const deserializeClassifierGroup = (classifierGroup: Group): Classifier => {};

export const deserialize = (filename: string) => {
  let f = new File(filename, "r");

  if (!(f.type === "Group")) {
    throw Error("Expected group at top level");
  }

  const projectGroup = getGroup(f, "project");
  const project = deserializeProjectGroup(projectGroup);

  // const classifierGroup = getGroup("classifier")
  // classifier = deserializeClassifier(classifierGroup);

  // return {
  //   project, classifier;
  // }
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

const getAttr = (root: File | Group, attr: string) => {
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
