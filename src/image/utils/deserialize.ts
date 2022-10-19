import {
  convertToImage,
  createRenderedTensor,
  generateDefaultChannels,
} from "image/utils/imageHelper";
import { SerializedImageType, ImageType } from "types";
import { _SerializedImageType } from "types/SerializedImageType"; // TODO: immge_data
import * as ImageJS from "image-js"; // TODO: image_data
import _ from "lodash";
import { tensor2d, tensor4d } from "@tensorflow/tfjs";

export const deserializeProject = (files: FileList) => {};

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
