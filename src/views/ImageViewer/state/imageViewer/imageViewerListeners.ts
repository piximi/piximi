import { createListenerMiddleware } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import { annotatorSlice } from "../annotator";
import { dataSlice } from "store/data";
import { imageViewerSlice } from "./imageViewerSlice";

import { createRenderedTensor } from "utils/tensorUtils";

import { TypedAppStartListening } from "store/types";
import {
  ImageViewerImageDetails,
  ImageViewerTimepointProperties,
} from "views/ImageViewer/utils/types";
import { TPKey, TSImageObject } from "store/data/types";
import { Colors } from "utils/types";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

const getRenderedSources = async (
  imageSeries: TSImageObject,
  activePlane: number,
  activeTimepoint: TPKey,
  ZTColors: Record<TPKey, { ZTColors: Colors }> | Colors,
): Promise<{ activeSrcs: string[]; ZTPreviews: Record<TPKey, string> }> => {
  const ZTPreviews: Record<TPKey, string> = {};
  const getColors = (tp: TPKey) => {
    if ("color" in ZTColors) {
      return ZTColors as Colors;
    }
    return ZTColors[tp].ZTColors;
  };
  for await (const [tp, img] of Object.entries(imageSeries.timepoints)) {
    const ZTPreview = await createRenderedTensor(
      img.data,
      getColors(tp),
      imageSeries.bitDepth,
      activePlane,
    );
    ZTPreviews[+tp] = ZTPreview;
  }
  const activeSrcs = await createRenderedTensor(
    imageSeries.timepoints[activeTimepoint].data,
    getColors(activeTimepoint),
    imageSeries.bitDepth,
    undefined,
  );

  return { activeSrcs, ZTPreviews };
};

startAppListening({
  actionCreator: imageViewerSlice.actions.prepareImageViewer,
  effect: async (action, listenerAPI) => {
    const { images: initialImageIds, annotations: annotationIds } =
      action.payload.selectedThingIds;
    if (initialImageIds.length === 0 && annotationIds.length === 0) return;

    const dataState = listenerAPI.getState().data;

    let activeImageId: string | undefined = undefined;

    // If annotations are selected in the project view, load the images they came from
    const imageIdsFromAnn: string[] = [];
    annotationIds.forEach((annotationId) => {
      const annotation = dataState.annotations.entities[annotationId];
      if (annotation) {
        imageIdsFromAnn.push(annotation.imageId);
      }
    });

    // If both images and annotations are selected, merge the two lists
    // imageIdsFromAnn is first to ensure that initial active image contains the working annotation, if any
    const imageIds = [...new Set([...imageIdsFromAnn, ...initialImageIds])];

    activeImageId = imageIds[0];

    const imageStack: Record<string, ImageViewerImageDetails> = {};

    for await (const imageId of imageIds) {
      const imageSeries = dataState.images.entities[imageId];
      const ZTColors = Object.entries(imageSeries.timepoints).reduce(
        (colorData: Record<TPKey, { ZTColors: Colors }>, [tp, data]) => {
          colorData[tp] = { ZTColors: data.colors };
          return colorData;
        },
        {},
      );
      const { activeSrcs, ZTPreviews } = await getRenderedSources(
        imageSeries,
        0,
        "0",
        ZTColors,
      );
      imageStack[imageId] = {
        id: imageId,
        activePlane: 0,
        activeTimepoint: "0",
        activeSrcs,
        timepoints: Object.keys(imageSeries.timepoints).reduce(
          (tpProps: Record<TPKey, ImageViewerTimepointProperties>, tp) => {
            tpProps[tp] = {
              ZTPreview: ZTPreviews[tp],
              ZTColors: imageSeries.timepoints[tp].colors,
            };
            return tpProps;
          },
          {},
        ),
      };
    }

    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageStack({
        images: imageStack,
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
      imageViewerSlice.actions.setActiveImageSeriesId({
        imageId: activeImageId,
        prevImageId: undefined,
      }),
    );
  },
});
startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageSeriesId,
  effect: async (action, listenerAPI) => {
    const { imageId: activeImageSeriesId, prevImageId } = action.payload;
    if (!prevImageId) return;

    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: true }),
    );

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
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();
    const activeImageSeriesData =
      dataState.images.entities[activeImageSeriesId];
    const activeImageSeriesDisplayProperties =
      imageViewerState.imageStack[activeImageSeriesId];
    const activeTimepoint = activeImageSeriesDisplayProperties.activeTimepoint;

    const activeAnnotationIds = activeImageSeriesData.containing.reduce(
      (annIds: string[], id) => {
        const annotation = dataState.annotations.entities[id];
        if (annotation.timepoint === activeTimepoint) annIds.push(id);
        return annIds;
      },
      [],
    );

    const res = await getRenderedSources(
      activeImageSeriesData,
      activeImageSeriesDisplayProperties.activePlane,
      activeImageSeriesDisplayProperties.activeTimepoint,
      activeImageSeriesDisplayProperties.timepoints,
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveAnnotationIds({
        annotationIds: activeAnnotationIds,
      }),
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs: res.activeSrcs,
      }),
    );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveSeriesTZPreviews({
        previews: res.ZTPreviews,
      }),
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setImageIsLoading({ isLoading: false }),
    );
  },
});

startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageTimepoint,
  effect: async (action, listenerAPI) => {
    const tp = action.payload.tp;
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();

    const activeImageSeriesId = imageViewerState.activeImageSeriesId;
    if (!activeImageSeriesId) return;

    const activeSeriesDisplayDetails =
      imageViewerState.imageStack[activeImageSeriesId];

    const activeImageSeriesData =
      dataState.images.entities[activeImageSeriesId];

    const activeImage = activeImageSeriesData.timepoints[tp];

    const renderedSrcs = await createRenderedTensor(
      activeImage.data,
      activeSeriesDisplayDetails.timepoints[tp].ZTColors,
      activeImageSeriesData.bitDepth,
      undefined,
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs,
      }),
    );
    listenerAPI.dispatch(
      annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
    );
  },
});
startAppListening({
  actionCreator: imageViewerSlice.actions.setActiveImageActivePlane,
  effect: async (action, listenerAPI) => {
    const pl = action.payload.plane;
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();

    const activeImageSeriesId = imageViewerState.activeImageSeriesId;
    if (!activeImageSeriesId) return;

    const activeImageSeriesDisplayProperties =
      imageViewerState.imageStack[activeImageSeriesId];

    const activeImageSeriesData =
      dataState.images.entities[activeImageSeriesId];

    const res = await getRenderedSources(
      activeImageSeriesData,
      pl,
      activeImageSeriesDisplayProperties.activeTimepoint,
      activeImageSeriesDisplayProperties.timepoints,
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveSeriesTZPreviews({
        previews: res.ZTPreviews,
      }),
    );
  },
});

startAppListening({
  actionCreator: imageViewerSlice.actions.updateActiveImageColors,
  effect: async (action, listenerAPI) => {
    const colors = action.payload.colors;
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();

    const activeImageSeriesId = imageViewerState.activeImageSeriesId;
    if (!activeImageSeriesId) return;

    const activeSeriesDisplayDetails =
      imageViewerState.imageStack[activeImageSeriesId];
    const activeTimepoint = activeSeriesDisplayDetails.activeTimepoint;

    const activeImageSeriesData =
      dataState.images.entities[activeImageSeriesId];

    const activeImage = activeImageSeriesData.timepoints[activeTimepoint];

    const colorsEditable = {
      range: { ...colors.range },
      visible: { ...colors.visible },
      color: colors.color,
    };

    const renderedSrcs = await createRenderedTensor(
      activeImage.data,
      colorsEditable,
      activeImageSeriesData.bitDepth,
      undefined,
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs,
      }),
    );
  },
});
startAppListening({
  actionCreator: imageViewerSlice.actions.updateActiveImageSeriesColors,
  effect: async (action, listenerAPI) => {
    const colors = action.payload.colors;
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();

    const activeImageSeriesId = imageViewerState.activeImageSeriesId;
    if (!activeImageSeriesId) return;

    const { activeTimepoint, activePlane } =
      imageViewerState.imageStack[activeImageSeriesId];

    const activeImageSeriesData =
      dataState.images.entities[activeImageSeriesId];
    const colorsEditable = {
      range: { ...colors.range },
      visible: { ...colors.visible },
      color: colors.color,
    };

    const res = await getRenderedSources(
      activeImageSeriesData,
      activePlane,
      activeTimepoint,
      colorsEditable,
    );

    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs: res.activeSrcs,
      }),
    );
    listenerAPI.dispatch(
      imageViewerSlice.actions.setActiveSeriesTZPreviews({
        previews: res.ZTPreviews,
      }),
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
      if (imageId === listenerAPI.getState().imageViewer.activeImageSeriesId) {
        listenerAPI.dispatch(
          imageViewerSlice.actions.addActiveAnnotationId({
            annotationId: annotation.id,
          }),
        );
      }
    });
  },
});
