import IJSImage, { Stack as IJSStack } from "image-js";
import { parseDicom } from "dicom-parser";

import {
  ImageFileError,
  ImageFileShapeInfo,
  ImageFileType,
  ImageShapeInfo,
  ImageShapeInfoImage,
  MIMEType,
  V01ImageObject,
  V02Category,
  V02ImageObject,
  V02Kind,
  V11ModelInfo,
} from "./types";
import { extractImageFileDetails } from "utils/tensorUtils";
import { ImageShapeEnum, MIMETYPES } from "./enums";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertState } from "utils/types";
import { AlertType } from "utils/enums";
import { ImageMetadata, ImageData } from "store/data/types";
import { isEnumValue, updateRecordArray } from "utils/objectUtils";
import { generateUUID } from "store/data/utils";
import {
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "store/data/constants";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { tensor2d, image as tfImage } from "@tensorflow/tfjs";

async function decodeImageFile(imageFile: File, imageTypeEnum: ImageShapeEnum) {
  let imageStack: IJSStack;
  if (imageTypeEnum === ImageShapeEnum.DicomImage) {
    imageStack = await decodeDicomImage(imageFile);
  } else {
    imageStack = await loadImageFileAsStack(imageFile);
  }

  return {
    imageStack,
    fileName: imageFile.name,
  } as ImageFileType;
}

export const decodeDicomImage = async (imageFile: File) => {
  const imgArrayBuffer = await imageFile.arrayBuffer();

  const imgArray = new Uint8Array(imgArrayBuffer);

  const dicomImgData = parseDicom(imgArray);
  const pixelDataElement = dicomImgData.elements.x7fe00010;

  const samplesPerPixel = dicomImgData.int16("x00280002");
  const rows = dicomImgData.int16("x00280010");
  const columns = dicomImgData.int16("x00280011");
  const bitsAllocated = dicomImgData.int16("x00280100");

  if (!samplesPerPixel || !rows || !columns || !bitsAllocated) {
    throw Error("Failed to parse dicom image tags");
  }

  let pixelData: Uint16Array | Uint8Array;
  if (bitsAllocated === 8) {
    pixelData = new Uint8Array(
      dicomImgData.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length / 2,
    );
  } else {
    pixelData = new Uint16Array(
      dicomImgData.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length / 2,
    );
  }

  const rowXCol = rows * columns;
  const dataSize = pixelData.length;
  const slices = dataSize / rowXCol;

  const images: IJSImage[] = [];
  if (Number.isInteger(slices)) {
    for (let i = 0; i < dataSize; i += rowXCol) {
      const slicePixelData = pixelData.slice(i, i + rowXCol);
      const img = new IJSImage(rows, columns, slicePixelData, {
        components: samplesPerPixel,
        bitDepth: bitsAllocated,
        alpha: 0,
      });

      for (let i = 0; i < samplesPerPixel; i++) {
        images.push(img.getChannel(i));
      }
    }
  } else {
    throw new Error("Could not parse dicom image slices.");
  }

  return new IJSStack(images);
};
/*
  Receives a File blob and returns an IJSStack
  
  If the file is a greyscale, rgb, rgba, ImageJS will return a single
  IJSImage object, where the data field has the pixel data interleaved
  (including alpha, if present).

    e.g. for rgba: [r1, g1, b1, a1, r2, g2, b2, a2, ...]

  Otherwise ImageJS will return an IJSStack object, which is a sublcass
  of a simple array, where each element is a single channel IJSImage object.

  Instead we want to always return a stack, regardless of filetype.
  Alpha channel is discarded, if present.
  BitDepth and datat type is preserved.

  ---

  The File object, may come from an HTML <input type="file">,
  
  or generated via "fileFromPath" either here or in "nodeImageHelper.ts"
*/
export const loadImageFileAsStack = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer();

    const image = (await IJSImage.load(buffer, {
      ignorePalette: true,
    })) as IJSImage | IJSStack;

    return forceStack(image);
  } catch (err) {
    import.meta.env.NODE_ENV !== "production" &&
      console.error(`Error loading image file ${file.name}`);
    throw err;
  }
};
function isImageShapeValid(
  imageStack: Array<IJSImage>,
  channels: number,
  slices: number,
  imageShape: ImageShapeEnum,
) {
  if (imageShape === ImageShapeEnum.GreyScale) {
    return channels === 1 && imageStack.length === 1;
  } else if (imageShape === ImageShapeEnum.SingleRGBImage) {
    return channels === 3 && imageStack.length === 3;
  } else {
    return channels * slices === imageStack.length;
  }
}

//QUESTION: Is this used?
// export const uploadImages = async (
//   files: FileList,
//   channels: number,
//   slices: number,
//   referenceShape: ImageShapeInfo,
//   categoryId: string,
// ): Promise<{
//   imagesToUpload: {
//     seriesProperties: Omit<ImageMetadata, "timepoints">;
//     timepointProperties: ImageData;
//   }[];
//   warning: any;
//   errors: AlertState[];
// }> => {
//   const invalidImageFiles: Array<ImageFileError> = [];
//   const imagesToUpload: Array<{
//     seriesProperties: Omit<ImageMetadata, "timepoints">;
//     timepointProperties: ImageData;
//   }> = [];
//   const errors: Array<AlertState> = [];
//   let warning: AlertState | undefined;

//   for (const file of files) {
//     try {
//       const { imageStack, fileName } = await decodeImageFile(
//         file,
//         referenceShape.shape,
//       );
//       if (
//         !isImageShapeValid(imageStack, channels, slices, referenceShape.shape)
//       ) {
//         invalidImageFiles.push({
//           fileName: fileName,
//           error: `Could not match image to shape ${channels} (c) x ${slices} (z)`,
//         });
//       } else if (
//         !(imageStack[0].bitDepth === 8 || imageStack[0].bitDepth === 16)
//       ) {
//         invalidImageFiles.push({
//           fileName,
//           error: `Unsupported bit depth of ${imageStack[0].bitDepth}`,
//         });
//       } else {
//         try {
//           const imageToUpload = await convertToImage(
//             imageStack,
//             fileName,
//             undefined,
//             slices,
//             channels,
//           );
//           imageToUpload.metadata.kind = IMAGE_KIND;
//           imageToUpload.imageData.categoryId = categoryId;

//           imagesToUpload.push(imageToUpload);
//         } catch (err) {
//           const error = err as Error;
//           const stackTrace = await getStackTraceFromError(error);
//           errors.push({
//             alertType: AlertType.Error,
//             name: "Could not convert file to image",
//             description: error.message,
//             stackTrace: stackTrace,
//           });
//         }
//       }
//     } catch (err) {
//       import.meta.env.NODE_ENV !== "production" && console.error(err);
//       invalidImageFiles.push({
//         fileName: file.name,
//         error: "Could not decode",
//       });
//     }
//   }

//   if (invalidImageFiles.length) {
//     warning = {
//       alertType: AlertType.Warning,
//       name: "Could not draw image from files",
//       description: `Could not load or resolve images from the following files: ${invalidImageFiles.reduce(
//         (prev, curr) => prev + "\n" + curr.fileName + ": (" + curr.error + ")",
//         "",
//       )}`,
//     };
//   }
//   return { imagesToUpload, warning, errors };
// };

/*
 ----------------------------
 File blob & data url helpers
 ----------------------------
 */

export const forceStack = async (image: IJSImage | IJSStack) => {
  if (Array.isArray(image)) {
    return image as IJSStack;
  }
  const splitImage = (image as IJSImage).split({ preserveAlpha: false });
  if (image.alpha === 1) {
    return new IJSStack(splitImage.splice(0, splitImage.length - 1));
  }
  return splitImage;
};

/*
 Receives a path to an image file, retrieved via import, eg:

 import myImage from "path/to/myImage.png"

 or via url, eg:

 "https://piximi.photos/path/to/img"

 and optionally a name, which is inffered from path if not provided.

 A File object is generated, identical to a File
 object retrived via html:
 
 <input type="file">

 This should only be used browser side, 
 If you want to generate files node side, use the analogous function defined in
 "nodeImageHelper.ts".
*/
export const fileFromPath = async (
  imPath: string,
  name: string | undefined = undefined,
) => {
  let imName: string;

  if (!name) {
    const pathParts = imPath.split("/");
    imName = pathParts[pathParts.length - 1];
  } else {
    imName = name;
  }

  return fetch(imPath)
    .then((res) => res.blob())
    .then((blob) => new File([blob], imName, blob));
};

/*
  Converts a base64 dataURL encoded image into an ImageJS stack

  If the encoded image is a greyscale, rgb, or rgba, ImageJS will return a single
  IJSImage object, where the data field has the pixel data interleaved
  (including alpha, if present).

    e.g. for rgba: [r1, g1, b1, a1, r2, g2, b2, a2, ...]

  Otherwise ImageJS will return an IJSStack object, which is a sublcass
  of a simple array, where each element is a single channel IJSImage object.

  Instead we want to always return a stack, regardless of filetype.
  Alpha channel is discarded, if present.
  BitDepth and datat type is preserved.
 */
export const loadDataUrlAsStack = async (dataURL: string) => {
  try {
    const image = await IJSImage.load(dataURL, {
      ignorePalette: true,
    });

    return forceStack(image);
  } catch (err) {
    import.meta.env.NODE_ENV !== "production" &&
      console.error("Error loading dataURL");
    throw err;
  }
};

export const getImageInformation = (
  image: IJSImage | IJSStack,
): ImageShapeInfo => {
  // a "proper" RGB will be an IJSImage object with 3 components
  if (!Array.isArray(image) && image.components === 3) {
    return {
      shape: ImageShapeEnum.SingleRGBImage,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // 1 channel (greyscale) image will also be an IJSImage object
  } else if (!Array.isArray(image) && image.components === 1) {
    return {
      shape: ImageShapeEnum.GreyScale,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // should not happen
  } else if (!Array.isArray(image)) {
    import.meta.env.NODE_ENV !== "production" &&
      console.error("Unrecognized Image.JS.Image type, channels not in [1,3]");
    return {
      shape: ImageShapeEnum.InvalidImage,
    };
  }
  // else RGBstack, or multi-channel, or multi-z-stack image as an IJSStack object
  else {
    return {
      shape: ImageShapeEnum.HyperStackImage,
      components: image.length,
      bitDepth: image[0].bitDepth,
      alpha: image[0].alpha === 1,
    };
  }
};

//QUESTION: Is this used?
export const getImageFileInformation = async (
  file: File,
): Promise<ImageFileShapeInfo> => {
  const ext = file.type as MIMEType;
  try {
    // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
    if (!isEnumValue(MIMETYPES, file.type)) {
      import.meta.env.NODE_ENV !== "production" &&
        console.error("Invalid MIME Type:", ext);
      return { shape: ImageShapeEnum.InvalidImage, ext };
    }

    if (file.name.endsWith("dcm") || file.name.endsWith("DICOM")) {
      return { shape: ImageShapeEnum.DicomImage, ext: MIMETYPES.DICOM };
    }

    const buffer = await file.arrayBuffer();
    const image: IJSImage | IJSStack = await IJSImage.load(buffer, {
      ignorePalette: true,
    });

    return { ...getImageInformation(image), ext };
  } catch {
    return { shape: ImageShapeEnum.InvalidImage, ext };
  }
};
export const getUploadedFileTypes = async (files: FileList) => {
  const images: Record<number, Array<ImageShapeInfoImage>> = {};
  for (const file of files) {
    const ext = file.type as MIMEType;
    try {
      // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
      if (!isEnumValue(MIMETYPES, file.type)) {
        import.meta.env.NODE_ENV !== "production" &&
          console.error("Invalid MIME Type:", ext);
        updateRecordArray(images, ImageShapeEnum.InvalidImage, {
          shape: ImageShapeEnum.InvalidImage,
          fileName: file.name,
          ext,
          error: `Invalid MIME Type: ${ext}`,
        });
      }

      if (
        file.name.endsWith("dcm") ||
        file.name.endsWith("DICOM") ||
        file.name.endsWith("DCM")
      ) {
        const image = await decodeDicomImage(file);

        updateRecordArray(images, ImageShapeEnum.DicomImage, {
          shape: ImageShapeEnum.DicomImage,
          components: image.length,
          fileName: file.name,
          ext: MIMETYPES.DICOM,
          image,
        });
      } else {
        const buffer = await file.arrayBuffer();
        const image: IJSImage | IJSStack = await IJSImage.load(buffer, {
          ignorePalette: true,
        });

        const imageInfo = getImageInformation(image);

        const imageStack = await forceStack(image);

        updateRecordArray(images, imageInfo.shape, {
          ...imageInfo,
          ext,
          image: imageStack,
          fileName: file.name,
        });
      }
    } catch (err) {
      const error = err as Error;
      updateRecordArray(images, ImageShapeEnum.InvalidImage, {
        shape: ImageShapeEnum.InvalidImage,
        fileName: file.name,
        ext,
        error: `Could not parse image file. -- ${error.message}`,
      });
    }
  }
  return images;
};

export const v02GenerateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: V02Category = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    kind: kind,
    visible: true,
    containing: [],
  };
  return unknownCategory;
};
export const v02GenerateKind = (kindName: string, useUUID?: boolean) => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = v02GenerateUnknownCategory(kindId);
  const kind: V02Kind = {
    id: kindId,
    displayName: kindName,
    unknownCategoryId: unknownCategory.id,
    categories: [unknownCategory.id],
    containing: [],
  };
  return { kind, unknownCategory };
};

export const v11GetDefaultModelParams = (): Pick<
  V11ModelInfo,
  "optimizerSettings" | "preprocessSettings"
> => ({
  optimizerSettings: {
    epochs: 10,
    batchSize: 32,
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  preprocessSettings: {
    inputShape: {
      planes: 1,
      height: 20,
      width: 20,
      channels: 1,
    },
    shuffle: true,
    rescaleOptions: {
      rescale: true,
      center: false,
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
    trainingPercentage: 0.75,
  },
});

export const v11GetDefaultModelInfo = (): V11ModelInfo => ({
  ...v11GetDefaultModelParams(),
  evalResults: [],
});

export const v01GetPropertiesFromImageSync = (
  renderedIm: IJSImage,
  image: V01ImageObject,
  annotation: { boundingBox: number[] },
) => {
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);
  box.dispose();

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox as [number, number, number, number],
    bitDepth: image.bitDepth,
  };
};
export const v02GetPropertiesFromImage = async (
  image: V02ImageObject,
  annotation: { boundingBox: [number, number, number, number] },
) => {
  const renderedIm = await IJSImage.load(image.src);
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox,
  };
};
