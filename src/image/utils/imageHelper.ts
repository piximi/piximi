import * as ImageJS from "image-js";

/*
 ======================================
 Image Inspection/Introspection helpers
 ======================================
 */

export enum ImageShapeEnum {
  DicomImage,
  SingleRGBImage,
  HyperStackImage,
  InvalidImage,
}

const MIMETYPES = [
  "dcm",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/tif",
] as const;

type MIMEType = typeof MIMETYPES[number];

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  ext?: MIMEType;
  bitDepth?: ImageJS.BitDepth;
  components?: number;
  alpha?: boolean;
}

export const getImageInformation = async (
  file: File
): Promise<ImageShapeInfo> => {
  let ext: MIMEType;

  // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
  if (!(MIMETYPES as ReadonlyArray<string>).includes(file.type)) {
    return { shape: ImageShapeEnum.InvalidImage };
  } else {
    ext = file.type as MIMEType;
  }

  try {
    if (file.name.endsWith("dcm") || file.name.endsWith("DICOM")) {
      return { shape: ImageShapeEnum.DicomImage, ext: "dcm" };
    }

    const buffer = await file.arrayBuffer();
    const image: ImageJS.Image | ImageJS.Stack = await ImageJS.Image.load(
      buffer,
      { ignorePalette: true }
    );

    // a "proper" RGB will be an ImageJS.Image object with 3 components
    if (!Array.isArray(image) && image.components === 3) {
      return {
        shape: ImageShapeEnum.SingleRGBImage,
        components: image.components,
        bitDepth: image.bitDepth,
        alpha: image.alpha === 1,
        ext,
      };
      // 1 channel (greyscale) image will also be an ImageJs.Image object
    } else if (!Array.isArray(image)) {
      return {
        shape: ImageShapeEnum.HyperStackImage,
        components: image.components,
        bitDepth: image.bitDepth,
        alpha: image.alpha === 1,
        ext,
      };
      // else RGBstack, or multi-channel, or multi-z-stack image as an ImageJS.Stack object
    } else {
      return {
        shape: ImageShapeEnum.HyperStackImage,
        components: image.length,
        bitDepth: image[0].bitDepth,
        alpha: image[0].alpha === 1,
        ext,
      };
    }
  } catch (err) {
    return { shape: ImageShapeEnum.InvalidImage, ext };
  }
};
