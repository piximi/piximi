import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "store/rootReducer";
import {
  imageSeriesAdapter,
  imageAdapter,
  kindAdapter,
  categoryAdapter,
  planeAdapter,
  channelAdapter,
  channelMetaAdapter,
  annotationAdapter,
  annotationVolumeAdapter,
} from "./dataSliceV2";

// ── Tier 1: Raw adapter selectors ──────────────────────────────────────────

const imageSeriesSelectors = imageSeriesAdapter.getSelectors(
  (state: RootState) => state.dataV2.imageSeries
);
const imageSelectors = imageAdapter.getSelectors(
  (state: RootState) => state.dataV2.images
);
const kindSelectors = kindAdapter.getSelectors(
  (state: RootState) => state.dataV2.kinds
);
const categorySelectors = categoryAdapter.getSelectors(
  (state: RootState) => state.dataV2.categories
);
const planeSelectors = planeAdapter.getSelectors(
  (state: RootState) => state.dataV2.planes
);
const channelSelectors = channelAdapter.getSelectors(
  (state: RootState) => state.dataV2.channels
);
const channelMetaSelectors = channelMetaAdapter.getSelectors(
  (state: RootState) => state.dataV2.channelMetas
);
const annotationSelectors = annotationAdapter.getSelectors(
  (state: RootState) => state.dataV2.annotations
);
const annotationVolumeSelectors = annotationVolumeAdapter.getSelectors(
  (state: RootState) => state.dataV2.annotationVolumes
);

export const selectAllImageSeries = imageSeriesSelectors.selectAll;
export const selectImageSeriesById = imageSeriesSelectors.selectById;

export const selectAllImages = imageSelectors.selectAll;
export const selectImageById = imageSelectors.selectById;

export const selectAllKinds = kindSelectors.selectAll;
export const selectKindById = kindSelectors.selectById;

export const selectAllCategories = categorySelectors.selectAll;
export const selectCategoryById = categorySelectors.selectById;

export const selectAllPlanes = planeSelectors.selectAll;
export const selectPlaneById = planeSelectors.selectById;

export const selectAllChannels = channelSelectors.selectAll;
export const selectChannelById = channelSelectors.selectById;

export const selectAllChannelMetas = channelMetaSelectors.selectAll;
export const selectChannelMetaById = channelMetaSelectors.selectById;

export const selectAllAnnotations = annotationSelectors.selectAll;
export const selectAnnotationById = annotationSelectors.selectById;

export const selectAllAnnotationVolumes = annotationVolumeSelectors.selectAll;
export const selectAnnotationVolumeById = annotationVolumeSelectors.selectById;
