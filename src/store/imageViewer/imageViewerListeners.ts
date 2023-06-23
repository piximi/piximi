import { createListenerMiddleware } from "@reduxjs/toolkit";
import { ImageType, TypedAppStartListening } from "types";
import { imageViewerSlice } from "./imageViewerSlice";
import { getDeferredProperty } from "store/entities/utils";
import { createRenderedTensor } from "utils/common/image";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageId,
  effect: async (action, listenerAPI) => {
    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: true })
    );
    const newActiveId = action.payload.imageId;
    const newState = listenerAPI.getState();
    if (!newActiveId) {
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
    const savedActiveImage = newState.data.images.entities[newActiveId].saved;
    const activeImageChanges =
      newState.data.images.entities[newActiveId].changes;
    const updatedActiveImage = {
      ...savedActiveImage,
      ...activeImageChanges,
    } as ImageType;

    const activeAnnotationIds = [];
    for (const id of newState.data.annotationsByImage[newActiveId]) {
      const annotationCategory = getDeferredProperty(
        newState.data.annotations.entities[id],
        "categoryId"
      );
      const annotationIsDeleted =
        newState.data.annotations.entities[id].changes.deleted;

      const hiddenCategoryIds = newState.imageViewer.hiddenCategoryIds;

      if (
        !annotationIsDeleted &&
        !hiddenCategoryIds.includes(annotationCategory)
      ) {
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
    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: false })
    );
  },
});

startAppListening({
  predicate: (action, currentState, previousState) => {
    return (
      currentState.imageViewer.hiddenCategoryIds !==
      previousState.imageViewer.hiddenCategoryIds
    );
  },
  effect: async (action, listenerAPI) => {
    const currentState = listenerAPI.getState();
    const activeImageId = currentState.imageViewer.activeImageId;
    if (!activeImageId) return;
    const activeAnnotationIds = [];
    for (const id of currentState.data.annotationsByImage[activeImageId]) {
      const annotationCategory = getDeferredProperty(
        currentState.data.annotations.entities[id],
        "categoryId"
      );
      const annotationIsDeleted =
        currentState.data.annotations.entities[id].changes.deleted;

      const hiddenCategoryIds = currentState.imageViewer.hiddenCategoryIds;

      if (
        !annotationIsDeleted &&
        !hiddenCategoryIds.includes(annotationCategory)
      ) {
        activeAnnotationIds.push(id);
      }
    }

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveAnnotationIds({
        annotationIds: activeAnnotationIds,
      })
    );
  },
});
