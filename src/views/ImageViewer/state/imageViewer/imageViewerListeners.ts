import { createListenerMiddleware } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import { annotatorSlice } from "../annotator";
import { dataSlice } from "store/data";
import { imageViewerSlice } from "./imageViewerSlice";

import { createRenderedTensor } from "utils/tensorUtils";

import { AnnotationObject, ImageObject } from "store/data/types";
import { TypedAppStartListening } from "store/types";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: imageViewerSlice.actions.prepareImageViewer,
  effect: (action, listenerAPI) => {
    const selectedThingIds = action.payload.selectedThingIds;
    const dataState = listenerAPI.getState().data;
    if (selectedThingIds.length === 0) return;
    let imageIds: string[] = [];
    const annotationIds: string[] = [];
    let activeImageId: string | undefined = undefined;
    selectedThingIds.forEach((thingId) => {
      const thing = dataState.things.entities[thingId];
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
    listenerAPI.dispatch(
      annotatorSlice.actions.setSelectedAnnotationIds({
        annotationIds,
        workingAnnotationId: annotationIds[0],
      }),
    );
    listenerAPI.dispatch(
      annotatorSlice.actions.setWorkingAnnotation({
        annotation: annotationIds[0],
      }),
    );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageId({
        imageId: activeImageId,
        prevImageId: undefined,
      }),
    );
  },
});
startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageId,
  effect: async (action, listenerAPI) => {
    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: true }),
    );
    const newActiveImageId = action.payload.imageId;
    const { data: dataState, annotator: annotatorState } =
      listenerAPI.getState();
    if (!newActiveImageId) {
      listenerAPI.dispatch(
        imageViewerSlice.actions.setActiveImageRenderedSrcs({
          renderedSrcs: [],
        }),
      );
      listenerAPI.dispatch(
        imageViewerSlice.actions.setActiveAnnotationIds({ annotationIds: [] }),
      );
      return;
    }
    const activeImage = {
      ...(dataState.things.entities[newActiveImageId]! as ImageObject),
    };
    const imageChanges = annotatorState.changes.things.edited[
      newActiveImageId
    ] as Partial<ImageObject>;

    if (imageChanges) {
      if ("colors" in imageChanges) activeImage.colors = imageChanges.colors!;
      if ("src" in imageChanges) activeImage.src = imageChanges.src!;
    }

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveAnnotationIds({
        annotationIds: activeImage.containing,
      }),
    );
    const renderedSrcs = await createRenderedTensor(
      activeImage.data,
      activeImage.colors,
      activeImage.bitDepth,
      undefined,
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs }),
    );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: false }),
    );
  },
});

startAppListening({
  predicate: (action, currentState, previousState) => {
    return (
      currentState.data.categories.ids.length <
      previousState.data.categories.ids.length
    );
  },
  effect: async (action, listenerApi) => {
    const { imageViewer, data } = listenerApi.getState();
    const { data: oldData } = listenerApi.getOriginalState();
    const deletedCategories = difference(
      oldData.categories.ids,
      data.categories.ids,
    ) as string[];
    const filteredCats = imageViewer.filters.categoryId;
    const deletedFilters = intersection(filteredCats, deletedCategories);
    if (deletedFilters.length > 0) {
      listenerApi.dispatch(
        imageViewerSlice.actions.removeFilters({
          categoryIds: deletedFilters,
        }),
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
          }),
        );
      }
    });
  },
});
