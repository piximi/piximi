import { createListenerMiddleware, addListener } from "@reduxjs/toolkit";
import type { TypedStartListening, TypedAddListener } from "@reduxjs/toolkit";
import { RootState } from "store/reducer/reducer";
import { AppDispatch } from "store/stores/productionStore";
import { uploadImages } from "./dataSlice";
import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import { imageViewerSlice } from "store/imageViewer";
import { applicationSlice } from "store/application";
import { dataSlice } from "store/data";
import { createRenderedTensor } from "utils/common/image";
import { AlertStateType, AlertType, ImageType, OldImageType } from "types";

import { getStackTraceFromError } from "utils";

import {
  ImageShapeEnum,
  loadImageFileAsStack,
  convertToImage,
} from "utils/common/image";
import { projectSlice } from "store/project";
import { batch } from "react-redux";

export const dataMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening =
  dataMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>;
type ImageFileType = {
  fileName: string;
  imageStack: ImageJS.Stack;
};

type ImageFileError = {
  fileName: string;
  error: string;
};
startAppListening({
  predicate: (action, currentState: RootState, previousState: RootState) => {
    return (
      currentState.data.annotations.ids !== previousState.data.annotations.ids
    );
  },
  effect: (action, listenerAPI) => {
    //console.log((listenerAPI.getState() as any).data.annotations.ids);
  },
});

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

// startAppListening({
//   predicate: (action, currentState: RootState, previousState: RootState) => {
//     return currentState.annotator.activeImageId !== previousState.annotator.activeImageId;
//   },
//   effect: async (action, listenerAPI) => {
//     const currentStore = listenerAPI.getState().data;
//     if (!currentStore.activeImage) return;
//     const image = currentStore.images.entities[currentStore.activeImage];
//     const tmpRenderedSrc = Array(image.shape.planes);
//     tmpRenderedSrc[image.activePlane] = image.src;
//     listenerAPI.dispatch(
//       setActiveImageRenderedSrcs({ renderedSrcs: tmpRenderedSrc })
//     );
//     const renderedSrcs = await createRenderedTensor(
//       image.data,
//       image.colors,
//       image.bitDepth,
//       undefined
//     );
//     listenerAPI.dispatch(
//       setActiveImageRenderedSrcs({ renderedSrcs: renderedSrcs })
//     );
//   },
// });

startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageId,
  effect: async (action, listenerAPI) => {
    const newActiveId = action.payload.imageId;
    const newState = listenerAPI.getState();
    if (!newActiveId) {
      listenerAPI.dispatch(
        imageViewerSlice.actions.setActiveImageRenderedSrcs({
          renderedSrcs: [],
        })
      );
      return;
    }
    const storedActiveImage = newState.data.images.entities[newActiveId];
    const stagedActiveImage = newState.data.stagedImages.entities[newActiveId];
    const updatedActiveImage = {
      ...storedActiveImage,
      ...stagedActiveImage,
    } as ImageType;
    const deletedAnnotations = newState.data.stagedAnnotations.ids.filter(
      (id) => newState.data.stagedAnnotations.entities[id]?.deleted === true
    ) as Array<string>;
    const activeAnnotationIds = [];
    for (const id of newState.data.annotationsByImage[newActiveId]) {
      if (!deletedAnnotations.includes(id)) {
        activeAnnotationIds.push(id);
      }
    }

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveAnnotationIds({
        annotationIds: activeAnnotationIds,
      })
    );
    const renderedSrcs = await createRenderedTensor(
      updatedActiveImage.data,
      updatedActiveImage.colors,
      updatedActiveImage.bitDepth,
      undefined
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
    );
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
