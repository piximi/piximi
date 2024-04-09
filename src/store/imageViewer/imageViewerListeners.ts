import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { imageViewerSlice } from "./imageViewerSlice";
import { getCompleteEntity } from "store/entities/utils";
import { decodeAnnotationNew } from "utils/annotator/rle";
import { createRenderedTensor } from "utils/common/tensorHelpers";
import {
  NewAnnotationType,
  NewDecodedAnnotationType,
  NewImageType,
} from "store/data/types";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: imageViewerSlice.actions.prepareImageViewer,
  effect: (action, listenerAPI) => {
    const selectedThingIds = action.payload.selectedThingIds;
    const dataState = listenerAPI.getState().newData;

    let imageIds: string[] = [];
    const annotationIds: string[] = [];
    let activeImageId: string | undefined = undefined;

    selectedThingIds.forEach((thingId) => {
      const thing = getCompleteEntity(dataState.things.entities[thingId]);
      if (thing) {
        if (thing.kind === "Image") {
          imageIds.push(thingId);
          if (!activeImageId) {
            activeImageId = thing.id;
          }
        } else {
          annotationIds.push(thingId);
          imageIds.push((thing as NewAnnotationType).imageId);
        }
      }
    });

    imageIds = [...new Set(imageIds)];
    if (imageIds.length > 0 && !activeImageId) {
      activeImageId = imageIds[0];
    }

    listenerAPI.dispatch(imageViewerSlice.actions.setImageStack({ imageIds }));
    // listenerAPI.dispatch(
    //   imageViewerSlice.actions.setSelectedAnnotationIds({ annotationIds })
    // );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageIdNew({
        imageId: activeImageId,
        prevImageId: undefined,
      })
    );
  },
});
startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageIdNew,
  effect: async (action, listenerAPI) => {
    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: true })
    );
    const newActiveImageId = action.payload.imageId;
    const dataState = listenerAPI.getState().newData;
    if (!newActiveImageId) {
      listenerAPI.dispatch(
        imageViewerSlice.actions.setActiveImageRenderedSrcs({
          renderedSrcs: [],
        })
      );
      listenerAPI.dispatch(
        imageViewerSlice.actions.setActiveAnnotationIds({ annotationIds: [] })
      );
      return;
    }
    const activeImage = getCompleteEntity(
      dataState.things.entities[newActiveImageId]
    )! as NewImageType;

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveAnnotationIds({
        annotationIds: activeImage.containing,
      })
    );
    const renderedSrcs = await createRenderedTensor(
      activeImage.data,
      activeImage.colors,
      activeImage.bitDepth,
      undefined
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
    );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: false })
    );
  },
});

startAppListening({
  actionCreator: imageViewerSlice.actions.setWorkingAnnotationNew,
  effect: async (action, listenerAPI) => {
    const dataState = listenerAPI.getState().newData;
    let annotationValue = action.payload.annotation;
    if (typeof annotationValue === "string") {
      const annotation = getCompleteEntity(
        dataState.things.entities[annotationValue]
      ) as NewAnnotationType;
      if (!annotation) return undefined;
      annotationValue = !annotation.decodedMask
        ? decodeAnnotationNew(annotation)
        : (annotation as NewDecodedAnnotationType);
    }
    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      imageViewerSlice.actions.setWorkingAnnotationNew({
        annotation: annotationValue,
        preparedByListener: true,
      })
    );
    listenerAPI.subscribe();
  },
});
