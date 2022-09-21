import * as ImageJS from "image-js";

import { Color, DEFAULT_COLORS } from "types";

declare module "image-js" {
  interface Image {
    colorDepth(newColorDepth: BitDepth): Image;
    min: number[];
    max: number[];
  }
}

/*
 ======================================
 Image Inspection/Introspection helpers
 ======================================
 */

export enum ImageShapeEnum {
  DicomImage,
  GreyScale,
  SingleRGBImage,
  HyperStackImage,
  InvalidImage,
}

const MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/dicom",
] as const;

type MIMEType = typeof MIMETYPES[number];

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  bitDepth?: ImageJS.BitDepth;
  components?: number;
  alpha?: boolean;
}

export interface ImageFileShapeInfo extends ImageShapeInfo {
  ext: MIMEType;
}

/*
 -----------------
 File blob helpers
 -----------------
 */

export const loadImageAsStack = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer();
    const image: ImageJS.Image | ImageJS.Stack = await ImageJS.Image.load(
      buffer,
      { ignorePalette: true }
    );

    const imageShapeInfo = getImageInformation(image);

    if (imageShapeInfo.shape !== ImageShapeEnum.HyperStackImage) {
      const imageStack: Array<ImageJS.Image> = [];
      for (let i = 0; i < image.components; i++) {
        imageStack.push(image.getChannel(i));
      }
      return new ImageJS.Stack(imageStack);
    } else {
      return image;
    }
  } catch (err) {
    process.env.NODE_ENV !== "production" &&
      console.error(`Error loading image file ${file.name}`);
    throw err;
  }
};

export const getImageFileInformation = async (
  file: File
): Promise<ImageFileShapeInfo> => {
  const ext = file.type as MIMEType;
  try {
    // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
    if (!(MIMETYPES as ReadonlyArray<string>).includes(file.type)) {
      process.env.NODE_ENV !== "production" &&
        console.error("Invalid MIME Type:", ext);
      return { shape: ImageShapeEnum.InvalidImage, ext };
    }

    if (file.name.endsWith("dcm") || file.name.endsWith("DICOM")) {
      return { shape: ImageShapeEnum.DicomImage, ext: "image/dicom" };
    }

    const buffer = await file.arrayBuffer();
    const image: ImageJS.Image | ImageJS.Stack = await ImageJS.Image.load(
      buffer,
      { ignorePalette: true }
    );

    return { ...getImageInformation(image), ext };
  } catch (err) {
    return { shape: ImageShapeEnum.InvalidImage, ext };
  }
};

/*
 ----------------------------
 Image.JS.Image|Stack Helpers
 ----------------------------
*/

export const getImageInformation = (
  image: ImageJS.Image | ImageJS.Stack
): ImageShapeInfo => {
  // a "proper" RGB will be an ImageJS.Image object with 3 components
  if (!Array.isArray(image) && image.components === 3) {
    return {
      shape: ImageShapeEnum.SingleRGBImage,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // 1 channel (greyscale) image will also be an ImageJs.Image object
  } else if (!Array.isArray(image) && image.components === 1) {
    return {
      shape: ImageShapeEnum.GreyScale,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // should not happen
  } else if (!Array.isArray(image)) {
    process.env.NODE_ENV !== "production" &&
      console.error("Unrecognized Image.JS.Image type, channels not in [1,3]");
    return {
      shape: ImageShapeEnum.InvalidImage,
    };
  }
  // else RGBstack, or multi-channel, or multi-z-stack image as an ImageJS.Stack object
  else {
    return {
      shape: ImageShapeEnum.HyperStackImage,
      components: image.length,
      bitDepth: image[0].bitDepth,
      alpha: image[0].alpha === 1,
    };
  }
};

/*
 ================================
 Image Color Manipulation Helpers
 ================================
 */

export const generateDefaultChannels = (numChannels: number): Array<Color> => {
  /**
   * Given the number of channels in an image, apply default color scheme. If multi-channel, we apply red to the first channel,
   * green to the second channel, etc.. (see DefaultColors type)
   * If image is greyscale, we assign the white color to that one channel.
   * **/
  let defaultChannels: Array<Color> = []; //number of channels depends on whether image is greyscale, RGB, or multi-channel

  for (let i = 0; i < numChannels; i++) {
    defaultChannels.push({
      color:
        numChannels > 1 && i < DEFAULT_COLORS.length
          ? DEFAULT_COLORS[i]
          : [255, 255, 255],
      range: [0, 255],
      // if image has more than 3 channels,
      // only show the first channel as default
      // (user can then toggle / untoggle the other channels if desired)
      visible: !(numChannels > 3 && i > 0),
    });
  }

  return defaultChannels;
};
