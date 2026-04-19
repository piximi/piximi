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
  (state: RootState) => state.dataV2.imageSeries,
);
const imageSelectors = imageAdapter.getSelectors(
  (state: RootState) => state.dataV2.images,
);
const kindSelectors = kindAdapter.getSelectors(
  (state: RootState) => state.dataV2.kinds,
);
const categorySelectors = categoryAdapter.getSelectors(
  (state: RootState) => state.dataV2.categories,
);
const planeSelectors = planeAdapter.getSelectors(
  (state: RootState) => state.dataV2.planes,
);
const channelSelectors = channelAdapter.getSelectors(
  (state: RootState) => state.dataV2.channels,
);
const channelMetaSelectors = channelMetaAdapter.getSelectors(
  (state: RootState) => state.dataV2.channelMetas,
);
const annotationSelectors = annotationAdapter.getSelectors(
  (state: RootState) => state.dataV2.annotations,
);
const annotationVolumeSelectors = annotationVolumeAdapter.getSelectors(
  (state: RootState) => state.dataV2.annotationVolumes,
);

export const selectImageSeriesEntities = imageSeriesSelectors.selectEntities;
export const selectAllImageSeries = imageSeriesSelectors.selectAll;
export const selectImageSeriesById = imageSeriesSelectors.selectById;

export const selectImageEntities = imageSelectors.selectEntities;
export const selectAllImages = imageSelectors.selectAll;
export const selectImageById = imageSelectors.selectById;

export const selectKindEntities = kindSelectors.selectEntities;
export const selectAllKinds = kindSelectors.selectAll;
export const selectKindById = kindSelectors.selectById;

export const selectCategoryEntities = categorySelectors.selectEntities;
export const selectAllCategories = categorySelectors.selectAll;
export const selectCategoryById = categorySelectors.selectById;

export const selectPlaneEntities = planeSelectors.selectEntities;
export const selectAllPlanes = planeSelectors.selectAll;
export const selectPlaneById = planeSelectors.selectById;

export const selectChannelEntities = channelSelectors.selectEntities;
export const selectAllChannels = channelSelectors.selectAll;
export const selectChannelById = channelSelectors.selectById;

export const selectChannelMetaEntities = channelMetaSelectors.selectEntities;
export const selectAllChannelMetas = channelMetaSelectors.selectAll;
export const selectChannelMetaById = channelMetaSelectors.selectById;

export const selectAnnotationEntities = annotationSelectors.selectEntities;
export const selectAllAnnotations = annotationSelectors.selectAll;
export const selectAnnotationById = annotationSelectors.selectById;

export const selectAnnotationVolumeEntities =
  annotationVolumeSelectors.selectEntities;
export const selectAllAnnotationVolumes = annotationVolumeSelectors.selectAll;
export const selectAnnotationVolumeById = annotationVolumeSelectors.selectById;

// ── Tier 1: Experiment selectors ───────────────────────────────────────────────

export const selectExperiment = ({
  dataV2,
}: {
  dataV2: RootState["dataV2"];
}) => {
  return dataV2.experiment;
};
// ── Tier 2: FK join selectors ───────────────────────────────────────────────

export const selectImagesBySeriesId = createSelector(
  [imageSelectors.selectAll, (_: RootState, seriesId: string) => seriesId],
  (images, seriesId) => images.filter((im) => im.seriesId === seriesId),
);

export const selectImagesByCategoryId = createSelector(
  [imageSelectors.selectAll, (_: RootState, categoryId: string) => categoryId],
  (images, categoryId) => images.filter((im) => im.categoryId === categoryId),
);

export const selectPlanesByImageId = createSelector(
  [planeSelectors.selectAll, (_: RootState, imageId: string) => imageId],
  (planes, imageId) => planes.filter((pl) => pl.imageId === imageId),
);

export const selectChannelsByPlaneId = createSelector(
  [channelSelectors.selectAll, (_: RootState, planeId: string) => planeId],
  (channels, planeId) => channels.filter((ch) => ch.planeId === planeId),
);

export const selectAnnotationVolumesByImageId = createSelector(
  [
    annotationVolumeSelectors.selectAll,
    (_: RootState, imageId: string) => imageId,
  ],
  (volumes, imageId) => volumes.filter((v) => v.imageId === imageId),
);

export const selectAnnotationVolumesByKindId = createSelector(
  [
    annotationVolumeSelectors.selectAll,
    (_: RootState, kindId: string) => kindId,
  ],
  (volumes, kindId) => volumes.filter((v) => v.kindId === kindId),
);

export const selectAnnotationVolumesByCategoryId = createSelector(
  [
    annotationVolumeSelectors.selectAll,
    (_: RootState, categoryId: string) => categoryId,
  ],
  (volumes, categoryId) => volumes.filter((v) => v.categoryId === categoryId),
);

export const selectAnnotationsByVolumeId = createSelector(
  [annotationSelectors.selectAll, (_: RootState, volumeId: string) => volumeId],
  (annotations, volumeId) => annotations.filter((a) => a.volumeId === volumeId),
);

export const selectCategoriesByKindId = createSelector(
  [categorySelectors.selectAll, (_: RootState, kindId: string) => kindId],
  (categories, kindId) =>
    categories.filter((c) => c.type === "annotation" && c.kindId === kindId),
);

export const selectChannelMetaByChannelId = createSelector(
  [
    channelSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    (_: RootState, channelId: string) => channelId,
  ],
  (channelDict, channelMetaDict, channelId) => {
    const metaId = channelDict[channelId]?.channelMetaId;
    return metaId ? channelMetaDict[metaId] : undefined;
  },
);

// ── Tier 2: Active-entity selectors ────────────────────────────────────────

export const selectActiveImage = createSelector(
  [
    imageSeriesSelectors.selectEntities,
    imageSelectors.selectEntities,
    (_: RootState, seriesId: string) => seriesId,
  ],
  (seriesDict, imageDict, seriesId) => {
    const activeImageId = seriesDict[seriesId]?.activeImageId;
    return activeImageId ? imageDict[activeImageId] : undefined;
  },
);

export const selectActivePlane = createSelector(
  [
    imageSelectors.selectEntities,
    planeSelectors.selectEntities,
    (_: RootState, imageId: string) => imageId,
  ],
  (imageDict, planeDict, imageId) => {
    const activePlaneId = imageDict[imageId]?.activePlaneId;
    return activePlaneId ? planeDict[activePlaneId] : undefined;
  },
);

export const selectActiveChannels = createSelector(
  [
    imageSelectors.selectEntities,
    channelSelectors.selectAll,
    (_: RootState, imageId: string) => imageId,
  ],
  (imageDict, channels, imageId) => {
    const activePlaneId = imageDict[imageId]?.activePlaneId;
    return activePlaneId
      ? channels.filter((ch) => ch.planeId === activePlaneId)
      : [];
  },
);

// ── Tier 2: Grid display selector ──────────────────────────────────────────

export const selectRepresentativeImages = createSelector(
  [imageSelectors.selectAll, imageSeriesSelectors.selectEntities],
  (images, seriesDict) =>
    images.filter((im) => {
      const series = seriesDict[im.seriesId];
      return !series?.timeSeries || im.timepoint === 0;
    }),
);
