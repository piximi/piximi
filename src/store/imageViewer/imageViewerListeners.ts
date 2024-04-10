import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { imageViewerSlice } from "./imageViewerSlice";
import { getCompleteEntity } from "store/entities/utils";
import { decodeAnnotation } from "utils/annotator/rle";
import { createRenderedTensor } from "utils/common/tensorHelpers";
import {
  AnnotationObject,
  DecodedAnnotationObject,
  ImageObject,
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
          imageIds.push((thing as AnnotationObject).imageId);
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
      imageViewerSlice.actions.setActiveImageId({
        imageId: activeImageId,
        prevImageId: undefined,
      })
    );
  },
});
startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageId,
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
    )! as ImageObject;

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
  actionCreator: imageViewerSlice.actions.setWorkingAnnotation,
  effect: async (action, listenerAPI) => {
    const dataState = listenerAPI.getState().newData;
    let annotationValue = action.payload.annotation;
    if (typeof annotationValue === "string") {
      const annotation = getCompleteEntity(
        dataState.things.entities[annotationValue]
      ) as AnnotationObject;
      if (!annotation) return undefined;
      annotationValue = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
    }
    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      imageViewerSlice.actions.setWorkingAnnotation({
        annotation: annotationValue,
        preparedByListener: true,
      })
    );
    listenerAPI.subscribe();
  },
});
