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
  const invalidImageFiles: Array<string> = [];
  const imageFiles: Array<ImageFileType> = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const img: ImageJS.Image | ImageJS.Stack = yield files[i]
        .arrayBuffer()
        .then((buffer) => {
          return ImageJS.Image.load(buffer, { ignorePalette: true });
        });
      const imageFile = {
        image: Array.isArray(img) ? img : [img],
        fileName: files[i].name,
      };
      imageFiles.push(imageFile);
    } catch (err) {
      invalidImageFiles.push(files[i].name);
    }
  }

  if (invalidImageFiles.length) {
    const warning: AlertStateType = {
      alertType: AlertType.Warning,
      name: "Could not draw image from files",
      description: `Could not load images from the following files: \n${invalidImageFiles.join(
        ", "
      )}`,
    };
    yield put(
      applicationSlice.actions.updateAlertState({ alertState: warning })
    );
    return;
  }

  const colors = yield select(currentColorsSelector);

  const singleRGBImages = imageShapeInfo === ImageShapeEnum.singleRGBImage;

  const skippedImages: Array<string> = [];
  const imagesToUpload: Array<ImageType> = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const imageObject = imageFiles[i].image;

    if (!checkImageShape(imageObject, channels, slices, singleRGBImages)) {
      skippedImages.push(imageFiles[i].fileName);
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

  if (skippedImages.length) {
    const warning: AlertStateType = {
      alertType: AlertType.Warning,
      name: "Could not resolve Image shape",
      description: `Could not match the following images to shape ${channels} (c) x ${slices} (z): \n${skippedImages.join(
        ", "
      )}`,
    };
    yield put(
      applicationSlice.actions.updateAlertState({ alertState: warning })
    );
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
