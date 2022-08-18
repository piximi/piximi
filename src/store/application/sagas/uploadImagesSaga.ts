import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";
import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import { imageViewerSlice, currentColorsSelector } from "store/image-viewer/";
import { applicationSlice } from "store/application";
import { projectSlice } from "store/project";

import { AlertStateType, AlertType, ImageType } from "types";

import { getStackTraceFromError } from "utils/getStackTrace";

import { convertToImage, ImageShapeEnum } from "image/imageHelper";

type ImageFileType = {
  fileName: string;
  image: Array<ImageJS.Image>;
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
  imageShapeInfo: ImageShapeEnum;
  isUploadedFromAnnotator: boolean;
  execSaga: boolean;
}>): any {
  if (!execSaga) return;

  const colors = yield select(currentColorsSelector);
  const singleRGBImages = imageShapeInfo === ImageShapeEnum.SingleRGBImage;
  const invalidImageFiles: Array<ImageFileError> = [];
  const imagesToUpload: Array<ImageType> = [];

  const imageFiles: Array<ImageFileType> = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const imageFile: ImageFileType = yield getImageData(
        files[i],
        imageShapeInfo
      );
      imageFiles.push(imageFile);
    } catch (err) {
      invalidImageFiles.push({
        fileName: files[i].name,
        error: "could not decode",
      });
    }
  }

  for (let i = 0; i < imageFiles.length; i++) {
    const imageObject = imageFiles[i].image;

    if (!checkImageShape(imageObject, channels, slices, singleRGBImages)) {
      invalidImageFiles.push({
        fileName: imageFiles[i].fileName,
        error: `Could not match image to shape ${channels} (c) x ${slices} (z)`,
      });
      continue;
    }

    if (![8, 16].includes(imageObject[0].bitDepth)) {
      invalidImageFiles.push({
        fileName: imageFiles[i].fileName,
        error: `unsupported bit depth of ${imageObject[0].bitDepth}`,
      });
      continue;
    }

    try {
      const imageToUpload: ImageType = yield convertToImage(
        imageFiles[i].image,
        imageFiles[i].fileName,
        colors,
        slices,
        channels
      );
      imagesToUpload.push(imageToUpload);
    } catch (err) {
      const error = err as Error;
      const stackTrace = yield getStackTraceFromError(error);
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

function* getImageData(imageFile: File, imageTypeEnum: ImageShapeEnum) {
  let img: ImageJS.Image | ImageJS.Stack;
  if (imageTypeEnum === ImageShapeEnum.DicomImage) {
    const imgArrayBuffer: ArrayBuffer = yield imageFile.arrayBuffer();
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
    image: Array.isArray(img) ? img : [img],
    fileName: imageFile.name,
  };
}

function checkImageShape(
  image: Array<ImageJS.Image>,
  channels: number,
  slices: number,
  singleRGBImage: boolean
) {
  const frames = image.length;
  if (singleRGBImage) {
    return frames === 1 && image[0].components === 3;
  } else {
    return channels * slices === frames;
  }
}
