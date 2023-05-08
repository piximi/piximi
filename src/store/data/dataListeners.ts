import { batch } from "react-redux";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import { dataSlice, uploadImages } from "./dataSlice";
import { imageViewerSlice } from "store/imageViewer";
import { applicationSlice } from "store/application";
import { projectSlice } from "store/project";
import {
  AlertStateType,
  AlertType,
  AppStartListening,
  ImageFileError,
  ImageFileType,
  OldImageType,
} from "types";

import { getStackTraceFromError } from "utils";
import {
  ImageShapeEnum,
  loadImageFileAsStack,
  convertToImage,
  createRenderedTensor,
} from "utils/common/image";
import { getCompleteEntity } from "store/entities/utils";

export const dataMiddleware = createListenerMiddleware();

export const startAppListening =
  dataMiddleware.startListening as AppStartListening;

//TODO - Change OldImageType

startAppListening({
  actionCreator: uploadImages,
  effect: async (action, listenerAPI) => {
    console.log("...heard dataSlice.uploadImages");

    const invalidImageFiles: Array<ImageFileError> = [];
    const imageFiles: Array<ImageFileType> = [];
    const imagesToUpload: Array<OldImageType> = [];

    const { files, channels, slices, referenceShape, isUploadedFromAnnotator } =
      action.payload;
    const activeImageId = listenerAPI.getState().imageViewer.activeImageId;

    for (const file of files) {
      try {
        const imageFile = await decodeImageFile(file, referenceShape.shape);
        imageFiles.push(imageFile);
      } catch (err) {
        process.env.NODE_ENV !== "production" && console.error(err);
        invalidImageFiles.push({
          fileName: file.name,
          error: "Could not decode",
        });
      }
    }
    for (const { imageStack, fileName } of imageFiles) {
      if (
        !checkImageShape(imageStack, channels, slices, referenceShape.shape)
      ) {
        invalidImageFiles.push({
          fileName,
          error: `Could not match image to shape ${channels} (c) x ${slices} (z)`,
        });
        continue;
      }

      if (![8, 16].includes(imageStack[0].bitDepth)) {
        invalidImageFiles.push({
          fileName,
          error: `Unsupported bit depth of ${imageStack[0].bitDepth}`,
        });
        continue;
      }

      try {
        const imageToUpload = await convertToImage(
          imageStack,
          fileName,
          undefined,
          slices,
          channels
        );

        imagesToUpload.push(imageToUpload);
      } catch (err) {
        const error = err as Error;
        const stackTrace = await getStackTraceFromError(error);
        const warning: AlertStateType = {
          alertType: AlertType.Error,
          name: "Could not convert file to image",
          description: error.message,
          stackTrace: stackTrace,
        };
        listenerAPI.dispatch(
          applicationSlice.actions.updateAlertState({ alertState: warning })
        );
      }
    }

    if (invalidImageFiles.length) {
      const warning: AlertStateType = {
        alertType: AlertType.Warning,
        name: "Could not draw image from files",
        description: `Could not load or resolve images from the following files: ${invalidImageFiles.reduce(
          (prev, curr) =>
            prev + "\n" + curr.fileName + ": (" + curr.error + ")",
          ""
        )}`,
      };
      listenerAPI.dispatch(
        applicationSlice.actions.updateAlertState({ alertState: warning })
      );
      return;
    }
    if (imagesToUpload.length) {
      if (isUploadedFromAnnotator) {
        batch(() => {
          listenerAPI.dispatch(
            dataSlice.actions.addImages({ images: imagesToUpload })
          );
          listenerAPI.dispatch(
            projectSlice.actions.selectImages({
              imageIds: imagesToUpload.map((image) => image.id),
            })
          );
          listenerAPI.dispatch(
            imageViewerSlice.actions.setActiveImageId({
              imageId: imagesToUpload[0].id,
              prevImageId: activeImageId,
              execSaga: true,
            })
          );
        });
      } else {
        listenerAPI.dispatch(
          dataSlice.actions.addImages({ images: imagesToUpload })
        );
      }
    }
  },
});

startAppListening({
  actionCreator: dataSlice.actions.deleteAllAnnotationsByImage,
  effect: (action, listenerAPI) => {
    const imageId = action.payload.imageId;
    if (imageId === listenerAPI.getState().imageViewer.activeImageId) {
      listenerAPI.dispatch(
        imageViewerSlice.actions.setActiveAnnotationIds({ annotationIds: [] })
      );
    }
  },
});

startAppListening({
  actionCreator: dataSlice.actions.updateImage,
  effect: async (action, listenerAPI) => {
    const { imageId, updates } = action.payload;
    const colors = updates.colors;
    const currentState = listenerAPI.getState();
    if (!colors || imageId !== currentState.imageViewer.activeImageId) return;

    const image = getCompleteEntity(
      currentState.data.images.entities[imageId]
    )!;

    const colorsEditable = {
      range: { ...colors.range },
      visible: { ...colors.visible },
      color: colors.color,
    };
    const renderedSrcs = await createRenderedTensor(
      image.data,
      colorsEditable,
      image.bitDepth,
      undefined
    );
    listenerAPI.dispatch(
      dataSlice.actions.updateImage({
        imageId: imageId,
        updates: { src: renderedSrcs[image.activePlane] },
      })
    );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
    );
  },
});

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

function checkImageShape(
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
