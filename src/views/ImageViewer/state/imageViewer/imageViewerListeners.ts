import { createListenerMiddleware } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import { annotatorSlice } from "../annotator";
import { dataSlice } from "store/data";
import { imageViewerSlice } from "./imageViewerSlice";

import { createRenderedTensor } from "utils/tensorUtils";

import { TypedAppStartListening } from "store/types";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: imageViewerSlice.actions.prepareImageViewer,
  effect: (action, listenerAPI) => {
    const { images: initialImageIds, annotations: annotationIds } =
      action.payload.selectedThingIds;
    const dataState = listenerAPI.getState().data;
    if (initialImageIds.length === 0 && annotationIds.length === 0) return;

    let activeImageId: string | undefined = undefined;
    const imageIdsFromAnn: string[] = [];
    annotationIds.forEach((annotationId) => {
      const annotation = dataState.annotations.entities[annotationId];
      if (annotation) {
        imageIdsFromAnn.push(annotation.imageId);
      }
    });

    // imageIdsFromAnn is first to ensure that initial visible image contains the working annotation, if any
    const imageIds = [...new Set([...imageIdsFromAnn, ...initialImageIds])];
    if (imageIds.length > 0 && !activeImageId) {
      activeImageId = imageIds[0];
    }

    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageStack({
        images: imageIds.reduce(
          (
            images: Record<
              string,
              {
                activePlane: number;
                activeTimepoint: number;
                renderedSrcs: Record<number, string[]>;
              }
            >,
            id,
          ) => {
            images[id] = {
              activePlane: 0,
              activeTimepoint: 0,
              renderedSrcs: {},
            };
            return images;
          },
          {},
        ),
      }),
    );

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
    const activeImageSeriesId = action.payload.imageId;
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();
    if (!activeImageSeriesId) {
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
    const activeTimepoint =
      imageViewerState.imageStack[activeImageSeriesId].activeTimepoint;
    const activeImageSeries = dataState.images.entities[activeImageSeriesId];
    const activeImage = activeImageSeries.timepoints[activeTimepoint];

    const activeAnnotationIds = activeImageSeries.containing.reduce(
      (annIds: string[], id) => {
        const annotation = dataState.annotations.entities[id];
        if (annotation.timepoint === activeTimepoint) annIds.push(id);
        return annIds;
      },
      [],
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveAnnotationIds({
        annotationIds: activeAnnotationIds,
      }),
    );
    const renderedSrcs = await createRenderedTensor(
      activeImage.data,
      activeImage.colors,
      activeImageSeries.bitDepth,
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
