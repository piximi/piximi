import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import {
  AlertStateType,
  AlertType,
  ImageFileError,
  ImageFileType,
} from "types";

import { getStackTraceFromError } from "utils";
import {
  ImageShapeEnum,
  loadImageFileAsStack,
  convertToImage,
  ImageShapeInfo,
} from "utils/common/image";
import { NewImageType } from "types/ImageType";

async function decodeImageFile(imageFile: File, imageTypeEnum: ImageShapeEnum) {
  let imageStack: ImageJS.Stack;
  if (imageTypeEnum === ImageShapeEnum.DicomImage) {
    const imgArrayBuffer = await imageFile.arrayBuffer();

    const imgArray = new Uint8Array(imgArrayBuffer);

    var dicomImgData = DicomParser.parseDicom(imgArray);
    var pixelDataElement = dicomImgData.elements.x7fe00010;

    const samplesPerPixel = dicomImgData.int16("x00280002");
    const rows = dicomImgData.int16("x00280010");
    const columns = dicomImgData.int16("x00280011");
    const bitsAllocated = dicomImgData.int16("x00280100");

    if (!samplesPerPixel || !rows || !columns || !bitsAllocated) {
      throw Error("Failed to parse dicom image tags");
    }

    var pixelData = new Uint16Array(
      dicomImgData.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length / 2
    );

    const img = new ImageJS.Image(rows, columns, pixelData, {
      components: samplesPerPixel,
      bitDepth: bitsAllocated,
      alpha: 0,
    });

    const channels: ImageJS.Image[] = [];
    for (let i = 0; i < samplesPerPixel; i++) {
      channels.push(img.getChannel(i));
    }
    imageStack = new ImageJS.Stack(channels);
  } else {
    imageStack = await loadImageFileAsStack(imageFile);
  }

  return {
    imageStack,
    fileName: imageFile.name,
  } as ImageFileType;
}

function isImageShapeValid(
  imageStack: Array<ImageJS.Image>,
  channels: number,
  slices: number,
  imageShape: ImageShapeEnum
) {
  if (imageShape === ImageShapeEnum.GreyScale) {
    return channels === 1 && imageStack.length === 1;
  } else if (imageShape === ImageShapeEnum.SingleRGBImage) {
    return channels === 3 && imageStack.length === 3;
  } else {
    return channels * slices === imageStack.length;
  }
}

export const uploadImages = async (
  files: FileList,
  channels: number,
  slices: number,
  referenceShape: ImageShapeInfo
) => {
  const invalidImageFiles: Array<ImageFileError> = [];
  const imagesToUpload: Array<NewImageType> = [];
  const errors: Array<AlertStateType> = [];
  let warning: AlertStateType | undefined;

  for (const file of files) {
    try {
      const { imageStack, fileName } = await decodeImageFile(
        file,
        referenceShape.shape
      );
      if (
        !isImageShapeValid(imageStack, channels, slices, referenceShape.shape)
      ) {
        invalidImageFiles.push({
          fileName: fileName,
          error: `Could not match image to shape ${channels} (c) x ${slices} (z)`,
        });
      } else if (
        !(imageStack[0].bitDepth === 8 || imageStack[0].bitDepth === 16)
      ) {
        invalidImageFiles.push({
          fileName,
          error: `Unsupported bit depth of ${imageStack[0].bitDepth}`,
        });
      } else {
        try {
          const imageToUpload = await convertToImage(
            imageStack,
            fileName,
            undefined,
            slices,
            channels
          );
          imageToUpload.kind = "Image";
          imageToUpload.containing = [];

          imagesToUpload.push(imageToUpload as NewImageType);
        } catch (err) {
          const error = err as Error;
          const stackTrace = await getStackTraceFromError(error);
          errors.push({
            alertType: AlertType.Error,
            name: "Could not convert file to image",
            description: error.message,
            stackTrace: stackTrace,
          });
        }
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
      invalidImageFiles.push({
        fileName: file.name,
        error: "Could not decode",
      });
    }
  }

  if (invalidImageFiles.length) {
    warning = {
      alertType: AlertType.Warning,
      name: "Could not draw image from files",
      description: `Could not load or resolve images from the following files: ${invalidImageFiles.reduce(
        (prev, curr) => prev + "\n" + curr.fileName + ": (" + curr.error + ")",
        ""
      )}`,
    };
  }
  return { imagesToUpload, warning, errors };
};
