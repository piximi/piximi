import { batch } from "react-redux";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import { dataSlice, uploadImages } from "./dataSlice";
import { imageViewerSlice } from "store/slices/imageViewer";
import { applicationSettingsSlice } from "store/slices/applicationSettings";
import { projectSlice } from "store/slices/project";
import {
  AlertStateType,
  AlertType,
  TypedAppStartListening,
  ImageFileError,
  ImageFileType,
  ImageType,
} from "types";

import { getStackTraceFromError } from "utils";
import {
  ImageShapeEnum,
  loadImageFileAsStack,
  convertToImage,
  createRenderedTensor,
} from "utils/common/image";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";

export const dataMiddleware = createListenerMiddleware();

export const startAppListening =
  dataMiddleware.startListening as TypedAppStartListening;

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

startAppListening({
  actionCreator: uploadImages,
  effect: async (action, listenerAPI) => {
    const invalidImageFiles: Array<ImageFileError> = [];
    const imageFiles: Array<ImageFileType> = [];
    const imagesToUpload: Array<ImageType> = [];

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
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          })
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
        applicationSettingsSlice.actions.updateAlertState({
          alertState: warning,
        })
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
            imageViewerSlice.actions.setImageStack({
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
          dataSlice.actions.addImages({
            images: imagesToUpload,
            isPermanent: true,
          })
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
  actionCreator: dataSlice.actions.addAnnotations,
  effect: (action, listenerAPI) => {
    action.payload.annotations.forEach((annotation) => {
      const imageId = annotation.imageId;
      if (imageId === listenerAPI.getState().imageViewer.activeImageId) {
        listenerAPI.dispatch(
          imageViewerSlice.actions.addActiveAnnotationId({
            annotationId: annotation.id,
          })
        );
      }
    });
  },
});

startAppListening({
  actionCreator: dataSlice.actions.updateImages,
  effect: async (action, listenerAPI) => {
    const { updates } = action.payload;

    const currentState = listenerAPI.getState();
    const srcUpdates: Array<{ id: string } & Partial<ImageType>> = [];
    let renderedSrcs: string[] = [];
    const numImages = updates.length;
    let imageNumber = 1;
    for await (const update of updates) {
      const { id: imageId, ...changes } = update;
      if (changes.colors) {
        const colors = changes.colors;
        const image = getCompleteEntity(
          currentState.data.images.entities[imageId]
        )!;

        const colorsEditable = {
          range: { ...colors.range },
          visible: { ...colors.visible },
          color: colors.color,
        };
        renderedSrcs = await createRenderedTensor(
          image.data,
          colorsEditable,
          image.bitDepth,
          undefined
        );

        srcUpdates.push({ id: imageId, src: renderedSrcs[image.activePlane] });
        if (imageId === currentState.imageViewer.activeImageId) {
          listenerAPI.dispatch(
            imageViewerSlice.actions.setActiveImageRenderedSrcs({
              renderedSrcs,
            })
          );
        }
        listenerAPI.dispatch(
          projectSlice.actions.setLoadMessage({
            message: `Updating image ${imageNumber} of ${numImages}`,
          })
        );
        imageNumber++;
      }
    }

    if (srcUpdates.length !== 0) {
      listenerAPI.unsubscribe();
      listenerAPI.dispatch(
        dataSlice.actions.updateImages({
          updates: srcUpdates,
        })
      );
      listenerAPI.subscribe();
    }
    listenerAPI.dispatch(
      projectSlice.actions.setLoadMessage({
        message: "",
      })
    );
  },
});

startAppListening({
  actionCreator: dataSlice.actions.reconcile,
  effect: async (action, listenerAPI) => {
    const newState = listenerAPI.getState();
    const previousState = listenerAPI.getOriginalState();
    const selectedImages = newState.project.selectedImageIds;
    const currentImages = newState.data.images.ids;
    const imagesToRemove = [];
    for (const imageId of selectedImages) {
      if (!currentImages.includes(imageId)) {
        imagesToRemove.push(imageId);
      }
    }
    listenerAPI.dispatch(
      projectSlice.actions.deselectImages({ ids: imagesToRemove })
    );
    if (!action.payload.keepChanges) return;
    const srcUpdates: Array<{ id: string; src: string }> = [];
    for (const entity of Object.values(
      previousState.data.annotations.entities
    )) {
      if (
        (!entity.saved.src ||
          entity.changes.boundingBox ||
          entity.changes.decodedMask) &&
        !entity.changes.deleted
      ) {
        const imageId = getDeferredProperty(entity, "imageId");
        if (!imageId) continue;
        const bbox = getDeferredProperty(entity, "boundingBox");
        const imageSrc = newState.data.images.entities[imageId].saved.src;
        const image = await ImageJS.Image.load(imageSrc);
        const object = image.crop({
          x: bbox[0],
          y: bbox[1],
          width: bbox[2] - bbox[0],
          height: bbox[3] - bbox[1],
        });
        const src = object.getCanvas().toDataURL();
        srcUpdates.push({ id: entity.saved.id, src });
      }
    }
    listenerAPI.dispatch(
      dataSlice.actions.updateAnnotations({
        updates: srcUpdates,
        isPermanent: true,
      })
    );
  },
});
