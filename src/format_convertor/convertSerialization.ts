import * as ImageJS from "image-js";
import _ from "lodash";
import { convertToImage } from "image/utils/imageHelper";
import { ImageType } from "types/ImageType";
import { _SerializedImageType } from "./types";

// TODO: image_data
export const _convertSerialization = async (image: _SerializedImageType) => {
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
