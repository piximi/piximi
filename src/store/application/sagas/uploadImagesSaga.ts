import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";
import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import { imageViewerSlice, currentColorsSelector } from "store/image-viewer/";
import { applicationSlice } from "store/application";
import { projectSlice } from "store/project";

import {
  AlertStateType,
  AlertType,
  ImageType,
  GeneratorReturnType,
} from "types";

import { getStackTraceFromError } from "utils/getStackTrace";

import { convertToImage } from "image/imageHelper";
import { ImageShapeInfo, ImageShapeEnum } from "image/utils/imageHelper";

type ImageFileType = {
  fileName: string;
  imageStack: Array<ImageJS.Image> | ImageJS.Stack;
};

type ImageFileError = {
  fileName: string;
  error: string;
};

export function* uploadImagesSaga({
  payload: {
    files,
    channels,
    slices,
    imageShapeInfo,
    isUploadedFromAnnotator,
    execSaga,
  },
}: PayloadAction<{
  files: FileList;
  channels: number;
  slices: number;
  imageShapeInfo: ImageShapeInfo;
  isUploadedFromAnnotator: boolean;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  const colors: ReturnType<typeof currentColorsSelector> = yield select(
    currentColorsSelector
  );

  const invalidImageFiles: Array<ImageFileError> = [];

  const imageFiles: Array<ImageFileType> = [];
  for (const file of files) {
    try {
      const imageFile: GeneratorReturnType<ReturnType<typeof decodeImageFile>> =
        yield decodeImageFile(file, imageShapeInfo.shape);
      imageFiles.push(imageFile);
    } catch (err) {
      invalidImageFiles.push({
        fileName: file.name,
        error: "could not decode",
      });
    }
  }

  const imagesToUpload: Array<ImageType> = [];
  for (const { imageStack, fileName } of imageFiles) {
    if (!checkImageShape(imageStack, channels, slices, imageShapeInfo.shape)) {
      invalidImageFiles.push({
        fileName,
        error: `Could not match image to shape ${channels} (c) x ${slices} (z)`,
      });
      continue;
    }

    if (![8, 16].includes(imageStack[0].bitDepth)) {
      invalidImageFiles.push({
        fileName,
        error: `unsupported bit depth of ${imageStack[0].bitDepth}`,
      });
      continue;
    }

    try {
      const imageToUpload: ReturnType<typeof convertToImage> =
        yield convertToImage(imageStack, fileName, colors, slices, channels);
      imagesToUpload.push(imageToUpload);
    } catch (err) {
      const error = err as Error;
      const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
        yield getStackTraceFromError(error);
      const warning: AlertStateType = {
        alertType: AlertType.Error,
        name: "Could not convert file to image",
        description: error.message,
        stackTrace: stackTrace,
      };
      yield put(
        applicationSlice.actions.updateAlertState({ alertState: warning })
      );
    }
  }

  if (invalidImageFiles.length) {
    const warning: AlertStateType = {
      alertType: AlertType.Warning,
      name: "Could not draw image from files",
      description: `Could not load or resolve images from the following files: ${invalidImageFiles.reduce(
        (prev, curr) => prev + "\n" + curr.fileName + ": (" + curr.error + ")",
        ""
      )}`,
    };
    yield put(
      applicationSlice.actions.updateAlertState({ alertState: warning })
    );
    return;
  }

  if (imagesToUpload.length) {
    if (isUploadedFromAnnotator) {
      yield put(
        imageViewerSlice.actions.addImages({ newImages: imagesToUpload })
      );
      yield put(
        imageViewerSlice.actions.setActiveImage({
          imageId: imagesToUpload[0].id,
          execSaga: true,
        })
      );
    } else {
      yield put(
        projectSlice.actions.uploadImages({ newImages: imagesToUpload })
      );
    }
  }
}

function* decodeImageFile(imageFile: File, imageTypeEnum: ImageShapeEnum) {
  let img: ImageJS.Image | ImageJS.Stack;
  if (imageTypeEnum === ImageShapeEnum.DicomImage) {
    const imgArrayBuffer: Awaited<ReturnType<typeof imageFile.arrayBuffer>> =
      yield imageFile.arrayBuffer();

    const imgArray = new Uint8Array(imgArrayBuffer);

    var dicomImgData = DicomParser.parseDicom(imgArray);
    var pixelDataElement = dicomImgData.elements.x7fe00010;

    const samplesPerPixel = dicomImgData.int16("x00280002");
    const rows = dicomImgData.int16("x00280010");
    const columns = dicomImgData.int16("x00280011");
    const bitsAllocated = dicomImgData.int16("x00280100");

    var pixelData = new Uint16Array(
      dicomImgData.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length / 2
    );

    img = new ImageJS.Image(rows, columns, pixelData, {
      components: samplesPerPixel,
      bitDepth: bitsAllocated,
      alpha: 0,
    });
  } else {
    img = yield imageFile.arrayBuffer().then((buffer) => {
      return ImageJS.Image.load(buffer, { ignorePalette: true });
    });
  }

  return {
    imageStack: Array.isArray(img) ? img : [img],
    fileName: imageFile.name,
  } as ImageFileType;
}

function checkImageShape(
  imageStack: Array<ImageJS.Image>,
  channels: number,
  slices: number,
  imageShapeInfo: ImageShapeEnum
) {
  const frames = imageStack.length;
  if (imageShapeInfo === ImageShapeEnum.SingleRGBImage) {
    return frames === 1 && imageStack[0].components === 3;
  } else {
    return channels * slices === frames;
  }
}
