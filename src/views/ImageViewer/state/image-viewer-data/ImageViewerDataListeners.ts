import { createListenerMiddleware } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import { dataSlice } from "store/data";

import { createRenderedTensor } from "utils/tensorUtils";

import { TypedAppStartListening } from "store/types";
import { ImageObject } from "store/data/types";

import { imageViewerDataSlice } from "./ImageViewerDataSlice";
import { imageViewerSlice } from "../imageViewer";
import { getRenderedSources } from "./utils";

export const imageViewerDataMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerDataMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: imageViewerDataSlice.actions.setActiveMetadataId,
  effect: async (action, listenerAPI) => {
    const { metadataId: activeMetadataId, prevMetadataId } = action.payload;
    if (!prevMetadataId) return;

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setImageIsLoading({ isLoading: true }),
    );

    if (!activeMetadataId) {
      listenerAPI.dispatch(
        imageViewerDataSlice.actions.setActiveMetadataRenderedSrcs([]),
      );
      listenerAPI.dispatch(
        imageViewerDataSlice.actions.setActiveAnnotationIds([]),
      );
      return;
    }
    const { data: dataState, imageViewerData: viewerDataState } =
      listenerAPI.getState();
    const activeImageMetadata = dataState.metadata.entities[activeMetadataId];
    const activeImageDataIds = activeImageMetadata.imageDataIds;
    const activeImageDataSet = activeImageDataIds.reduce(
      (set: Record<string, ImageObject>, id) => {
        set[id] = dataState.images.entities[id];
        return set;
      },
      {},
    );
    const activeMetadata = viewerDataState.metadataStack[activeMetadataId];
    const activeImageId = activeMetadata.activeImageId;

    const activeImageData = dataState.images.entities[activeImageId];

    const activeAnnotationIds =
      dataState.relationships.imageToAnnotations[activeImageData.id];

    const res = await getRenderedSources(
      activeImageMetadata,
      Object.values(activeImageDataSet),
      activeMetadata.activePlane,
      activeMetadata.activeImageId,
      activeImageDataSet,
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveAnnotationIds(activeAnnotationIds),
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveMetadataRenderedSrcs(
        res.activeSrcs,
      ),
    );
    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveTZPreviews(res.ZTPreviews),
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setImageIsLoading({ isLoading: false }),
    );
  },
});

// Updates the active souce with all of the planes in the current timepoint.
// Begins by cancelling all other running instances of this listener so stale computation doesnt hog resources
// Waits for 1 second before begining, only during this time is the listener able to be cancelled
startAppListening({
  actionCreator: imageViewerDataSlice.actions.setActiveImage,
  effect: async (action, listenerAPI) => {
    listenerAPI.cancelActiveListeners();
    await listenerAPI.delay(1000);

    const { data: dataState, imageViewerData: viewerDataState } =
      listenerAPI.getState();

    const activeMetadataId = viewerDataState.activeMetdataId;

    if (!activeMetadataId) return;

    const { activeImageId } = viewerDataState.metadataStack[activeMetadataId];

    const { bitDepth, shape } = dataState.metadata.entities[activeMetadataId];

    const activeImageData = dataState.images.entities[activeImageId];

    const imageTensorData = activeImageData.data;

    const renderedSrcs = await createRenderedTensor(
      imageTensorData,
      activeImageData.colors,
      shape.channels,
      bitDepth,
      undefined,
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveMetadataRenderedSrcs(renderedSrcs),
    );
  },
});

// Updates the preview images for the current activeImage when the z-plane changes.
// Begins by cancelling all other running instances of this listener so stale computation doesnt hog resources
// Waits for 1 second before begining, only during this time is the listener able to be cancelled
startAppListening({
  actionCreator: imageViewerDataSlice.actions.setActiveMetadataActivePlane,
  effect: async (action, listenerAPI) => {
    listenerAPI.cancelActiveListeners();
    await listenerAPI.delay(1000);
    const { imageViewerData: viewerDataState, data: dataState } =
      listenerAPI.getState();

    const activeMetadataId = viewerDataState.activeMetdataId;
    if (!activeMetadataId) return;

    const { bitDepth, shape, imageDataIds } =
      dataState.metadata.entities[activeMetadataId];
    const { activePlane } = viewerDataState.metadataStack[activeMetadataId];

    const ZTPreviews: Record<string, string> = {};
    for await (const imgId of imageDataIds) {
      const image = dataState.images.entities[imgId];
      const colors = image.colors;
      const ZTPreview = await createRenderedTensor(
        image.data,
        colors,
        shape.channels,
        bitDepth,
        activePlane,
      );
      ZTPreviews[imgId] = ZTPreview;
    }
    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveTZPreviews(ZTPreviews),
    );
  },
});

startAppListening({
  actionCreator: dataSlice.actions.updateImageData,
  effect: async (action, listenerAPI) => {
    const colors = action.payload.changes.colors;
    if (!colors) return;
    const { data: dataState, imageViewerData: viewerDataState } =
      listenerAPI.getState();

    const activeMetadataId = viewerDataState.activeMetdataId;
    if (!activeMetadataId) return;

    const { activeImageId } = viewerDataState.metadataStack[activeMetadataId];

    const { bitDepth, shape } = dataState.metadata.entities[activeMetadataId];

    const activeImageData = dataState.images.entities[activeImageId];

    const colorsEditable = {
      range: { ...colors.range },
      visible: { ...colors.visible },
      color: colors.color,
    };

    const renderedSrcs = await createRenderedTensor(
      activeImageData.data,
      colorsEditable,
      shape.channels,
      bitDepth,
      undefined,
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveMetadataRenderedSrcs(renderedSrcs),
    );
    listenerAPI.dispatch(
      dataSlice.actions.updateImageData({
        id: action.payload.id,
        changes: { src: renderedSrcs[0] },
      }),
    );
  },
});
startAppListening({
  actionCreator: dataSlice.actions.batchUpdateImageData,
  effect: async (action, listenerAPI) => {
    const colors = action.payload[0].changes.colors;
    if (!colors) return;
    const { data: dataState, imageViewerData: viewerDataState } =
      listenerAPI.getState();

    const activeMetadataId = viewerDataState.activeMetdataId;
    if (!activeMetadataId) return;

    const { activeImageId: activeTimepoint, activePlane } =
      viewerDataState.metadataStack[activeMetadataId];

    const activeMetadata = dataState.metadata.entities[activeMetadataId];

    const metadataImages = activeMetadata.imageDataIds.map(
      (id) => dataState.images.entities[id],
    );
    const colorsEditable = {
      range: { ...colors.range },
      visible: { ...colors.visible },
      color: colors.color,
    };

    const res = await getRenderedSources(
      activeMetadata,
      metadataImages,
      activePlane,
      activeTimepoint,
      colorsEditable,
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveMetadataRenderedSrcs(
        res.activeSrcs,
      ),
    );
    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveTZPreviews(res.ZTPreviews),
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
  actionCreator: dataSlice.actions.batchAddAnnotations,
  effect: (action, listenerAPI) => {
    action.payload.forEach((annotation) => {
      const imageId = annotation.imageId;
      if (imageId === listenerAPI.getState().imageViewerData.activeMetdataId) {
        listenerAPI.dispatch(
          imageViewerDataSlice.actions.addActiveAnnotationIds(annotation.id),
        );
      }
    });
  },
});

// startAppListening({
//   matcher: isAnyOf(...Object.values(dataSlice.actions)),
//   effect: (action, listenerAPI) => {
//     console.log(action);
//     listenerAPI.dispatch(
//       imageViewerDataSlice.actions.setHasUnsavedChanges(true),
//     );
//   },
// });

startAppListening({
  predicate: (action, currentState, previousState) => {
    return (
      currentState.data.annotations.ids.length <
      previousState.data.annotations.ids.length
    );
  },
  effect: (action, listenerAPI) => {
    const prevAnnotationIds =
      listenerAPI.getOriginalState().data.annotations.ids;
    const currAnnotationIds = listenerAPI.getState().data.annotations.ids;

    const removedAnns = difference(prevAnnotationIds, currAnnotationIds);

    const selectedAnns =
      listenerAPI.getState().imageViewerData.selectedAnnotationIds;

    const activeAnns =
      listenerAPI.getState().imageViewerData.activeAnnotationIds;

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setSelectedAnnotationIds(
        selectedAnns.filter((id) => !removedAnns.includes(id)),
      ),
    );

    listenerAPI.dispatch(
      imageViewerDataSlice.actions.setActiveAnnotationIds(
        activeAnns.filter((id) => !removedAnns.includes(id)),
      ),
    );
  },
});
