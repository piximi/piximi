import { createListenerMiddleware } from "@reduxjs/toolkit";
import { difference, intersection, isEqual } from "lodash";

import { annotatorSlice } from "../annotator";
import { dataSlice } from "store/data";
import { applicationSettingsSlice } from "store/applicationSettings";
import { imageViewerSlice } from "./imageViewerSlice";

import { getCompleteEntity } from "store/entities/utils";
import { createRenderedTensor } from "utils/common/tensorHelpers";

import { AnnotationObject, ImageObject } from "store/data/types";
import { TypedAppStartListening } from "store/types";
import { initialState as annotatorInitialState } from "../annotator/annotatorSlice";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: applicationSettingsSlice.actions.resetApplicationState,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(imageViewerSlice.actions.resetImageViewer());
  },
});

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
    listenerAPI.dispatch(
      annotatorSlice.actions.setSelectedAnnotationIds({
        annotationIds,
        workingAnnotationId: annotationIds[0],
      })
    );
    listenerAPI.dispatch(
      annotatorSlice.actions.setWorkingAnnotation({
        annotation: annotationIds[0],
      })
    );
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
    const dataState = listenerAPI.getState().data;
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
      data.categories.ids
    ) as string[];
    const filteredCats = imageViewer.filters.categoryId;
    const deletedFilters = intersection(filteredCats, deletedCategories);
    if (deletedFilters.length > 0) {
      listenerApi.dispatch(
        imageViewerSlice.actions.removeFilters({
          categoryIds: deletedFilters,
        })
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
  predicate: (action, currentState, previousState) => {
    if (action.type.split("/")[0] !== "annotator") return false;
    const currentChanges = currentState.annotator.changes;
    const previousChanges = previousState.annotator.changes;
    return !isEqual(currentChanges, previousChanges);
  },
  effect: (action, listenerAPI) => {
    const annotatorState = listenerAPI.getState().annotator;
    if (isEqual(annotatorState.changes, annotatorInitialState.changes)) {
      listenerAPI.dispatch(
        imageViewerSlice.actions.setHasUnsavedChanges({
          hasUnsavedChanges: false,
        })
      );
    } else {
      listenerAPI.dispatch(
        imageViewerSlice.actions.setHasUnsavedChanges({
          hasUnsavedChanges: true,
        })
      );
    }
  },
});

startAppListening({
  actionCreator: annotatorSlice.actions.reconcileChanges,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(
      imageViewerSlice.actions.setHasUnsavedChanges({
        hasUnsavedChanges: false,
      })
    );
  },
});
