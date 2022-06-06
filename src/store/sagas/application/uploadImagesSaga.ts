import { put, select } from "redux-saga/effects";
import * as ImageJS from "image-js";
import { projectSlice, applicationSlice, imageViewerSlice } from "../../slices";
import { ImageType } from "../../../types/ImageType";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";
import { convertToImage, ImageShapeEnum } from "image/imageHelper";
import { currentColorsSelector } from "store/selectors/currentColorsSelector";

type ImageFileType = {
  fileName: string;
  image: Array<ImageJS.Image>;
};

type ImageFileError = {
  fileName: string;
  error: string;
};

export function* uploadImagesSaga({
  payload: { files, channels, slices, imageShapeInfo, isUploadedFromAnnotator },
}: {
  payload: {
    files: FileList;
    channels: number;
    slices: number;
    imageShapeInfo: ImageShapeEnum;
    isUploadedFromAnnotator: boolean;
  };
}): any {
  const colors = yield select(currentColorsSelector);
  const singleRGBImages = imageShapeInfo === ImageShapeEnum.SingleRGBImage;
  const invalidImageFiles: Array<ImageFileError> = [];
  const imagesToUpload: Array<ImageType> = [];

  const imageFiles: Array<ImageFileType> = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const buffer: ArrayBuffer = yield files[i].arrayBuffer();
      const img: ImageJS.Image | ImageJS.Stack = yield ImageJS.Image.load(
        buffer,
        { ignorePalette: true }
      );
      const imageFile = {
        image: Array.isArray(img) ? img : [img],
        fileName: files[i].name,
      };
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
        })
      );
    } else {
      yield put(
        projectSlice.actions.uploadImages({ newImages: imagesToUpload })
      );
    }
  }
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
