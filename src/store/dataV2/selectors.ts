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

import type {
  AnnotationObject,
  AnnotationVolumeEntities,
  CategoryEntities,
  Channel,
  ChannelMetaEntities,
  ExtendedAnnotationObject,
  ExtendedChannel,
  ExtendedImageObject,
  ImageEntities,
  ImageObject,
  PlaneEntities,
} from "./types";

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

export const selectImageSeriesIds = imageSeriesSelectors.selectIds;
export const selectImageSeriesEntities = imageSeriesSelectors.selectEntities;
export const selectAllImageSeries = imageSeriesSelectors.selectAll;
export const selectImageSeriesById = imageSeriesSelectors.selectById;
export const selectTotalImageSeries = imageSeriesSelectors.selectTotal;

export const selectImageIds = imageSelectors.selectIds;
export const selectImageEntities = imageSelectors.selectEntities;
export const selectAllImages = imageSelectors.selectAll;
export const selectImageById = imageSelectors.selectById;
export const selectTotalImages = imageSelectors.selectTotal;

export const selectKindIds = kindSelectors.selectIds;
export const selectKindEntities = kindSelectors.selectEntities;
export const selectAllKinds = kindSelectors.selectAll;
export const selectKindById = kindSelectors.selectById;
export const selectTotalKinds = kindSelectors.selectTotal;

export const selectCategoryIds = categorySelectors.selectIds;
export const selectCategoryEntities = categorySelectors.selectEntities;
export const selectAllCategories = categorySelectors.selectAll;
export const selectCategoryById = categorySelectors.selectById;
export const selectTotalCategories = categorySelectors.selectTotal;

export const selectPlaneIds = planeSelectors.selectIds;
export const selectPlaneEntities = planeSelectors.selectEntities;
export const selectAllPlanes = planeSelectors.selectAll;
export const selectPlaneById = planeSelectors.selectById;
export const selectTotalPlanes = planeSelectors.selectTotal;

export const selectChannelIds = channelSelectors.selectIds;
export const selectChannelEntities = channelSelectors.selectEntities;
export const selectAllChannels = channelSelectors.selectAll;
export const selectChannelById = channelSelectors.selectById;
export const selectTotalChannels = channelSelectors.selectTotal;

export const selectChannelMetaIds = channelMetaSelectors.selectIds;
export const selectChannelMetaEntities = channelMetaSelectors.selectEntities;
export const selectAllChannelMetas = channelMetaSelectors.selectAll;
export const selectChannelMetaById = channelMetaSelectors.selectById;
export const selectTotalChannelMetas = channelMetaSelectors.selectTotal;

export const selectAnnotationIds = annotationSelectors.selectIds;
export const selectAnnotationEntities = annotationSelectors.selectEntities;
export const selectAllAnnotations = annotationSelectors.selectAll;
export const selectAnnotationById = annotationSelectors.selectById;
export const selectTotalAnnotations = annotationSelectors.selectTotal;

export const selectAnnotationVolumeIds = annotationVolumeSelectors.selectIds;
export const selectAnnotationVolumeEntities =
  annotationVolumeSelectors.selectEntities;
export const selectAllAnnotationVolumes = annotationVolumeSelectors.selectAll;
export const selectAnnotationVolumeById = annotationVolumeSelectors.selectById;
export const selectTotalAnnotationVolumes =
  annotationVolumeSelectors.selectTotal;

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Experiment selectors ───────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

export const selectExperiment = ({
  dataV2,
}: {
  dataV2: RootState["dataV2"];
}) => {
  return dataV2.experiment;
};

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Images ─────────────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

// -- Base --

export const selectImagesBySeriesId = createSelector(
  [imageSelectors.selectAll, (_: RootState, seriesId: string) => seriesId],
  (images, seriesId) => images.filter((im) => im.seriesId === seriesId),
);
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
export const selectImagesByCategoryId = createSelector(
  [imageSelectors.selectAll, (_: RootState, categoryId: string) => categoryId],
  (images, categoryId) => images.filter((im) => im.categoryId === categoryId),
);

// -- Extended --

const buildExtendedImage = (
  image: ImageObject | undefined,
  planeDict: PlaneEntities,
  chMetaDict: ChannelMetaEntities,
  chs: Channel[],
  catDict: CategoryEntities,
): ExtendedImageObject | null => {
  if (!image) return null;
  const plane = planeDict[image.activePlaneId];
  if (!plane) return null;
  const category = catDict[image.categoryId];
  if (!category) return null;
  const channels = chs.reduce<ExtendedChannel[]>((acc, ch) => {
    const meta = chMetaDict[ch.channelMetaId];
    if (ch.planeId !== plane.id || !meta || !meta.visible) return acc;
    acc.push({
      ...ch,
      colorMap: meta.colorMap,
      rampMin: meta.rampMin,
      rampMax: meta.rampMax,
    });
    return acc;
  }, []);
  if (channels.length === 0) return null;
  return {
    id: image.id,
    name: image.name,
    seriesId: image.seriesId,
    shape: image.shape,
    categoryId: category.id,
    category,
    activePlaneIdx: plane.zIndex,
    timepoint: image.timepoint,
    bitDepth: image.bitDepth,
    partition: image.partition,
    channelsRef: channels,
  };
};

export const selectExtendedImageById = createSelector(
  [
    planeSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    channelSelectors.selectAll,
    categorySelectors.selectEntities,
    imageSelectors.selectEntities,
    (_state: RootState, id: string) => id,
  ],
  (planeDict, chMetaDict, chs, catDict, imageDict, imageId) =>
    buildExtendedImage(imageDict[imageId], planeDict, chMetaDict, chs, catDict),
);
export const selectExtendedImages = createSelector(
  [
    planeSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    channelSelectors.selectAll,
    categorySelectors.selectEntities,
    imageSelectors.selectAll,
  ],
  (planeDict, chMetaDict, chs, catDict, images): ExtendedImageObject[] => {
    const extIms: ExtendedImageObject[] = [];
    images.forEach((image) => {
      const ext = buildExtendedImage(
        image,
        planeDict,
        chMetaDict,
        chs,
        catDict,
      );
      if (ext) extIms.push(ext);
    });
    return extIms;
  },
);
export const selectRepresentativeImages = createSelector(
  [
    planeSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    channelSelectors.selectAll,
    categorySelectors.selectEntities,
    imageSelectors.selectEntities,
    imageSeriesSelectors.selectAll,
  ],
  (
    planeDict,
    chMetaDict,
    chs,
    catDict,
    imageDict,
    series,
  ): ExtendedImageObject[] => {
    const extIms: ExtendedImageObject[] = [];
    series.forEach((imSeries) => {
      const ext = buildExtendedImage(
        imageDict[imSeries.activeImageId],
        planeDict,
        chMetaDict,
        chs,
        catDict,
      );
      if (ext) extIms.push(ext);
    });
    return extIms;
  },
);

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Annotations ────────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

// -- Base --

export const selectAnnotationsByKindId = createSelector(
  [
    annotationSelectors.selectAll,
    annotationVolumeSelectors.selectEntities,
    (_: RootState, kindId: string) => kindId,
  ],
  (annotations, volumeDict, kindId) =>
    annotations.filter((a) => volumeDict[a.volumeId]?.kindId === kindId),
);
export const selectAnnotationsByCategoryId = createSelector(
  [
    annotationSelectors.selectAll,
    annotationVolumeSelectors.selectEntities,
    (_: RootState, categoryId: string) => categoryId,
  ],
  (annotations, volumeDict, categoryId) =>
    annotations.filter(
      (a) => volumeDict[a.volumeId]?.categoryId === categoryId,
    ),
);
export const selectAnnotationsByVolumeId = createSelector(
  [annotationSelectors.selectAll, (_: RootState, volumeId: string) => volumeId],
  (annotations, volumeId) => annotations.filter((a) => a.volumeId === volumeId),
);

// -- Extended --

const buildExtendedAnnotation = (
  ann: AnnotationObject | undefined,
  volumeDict: AnnotationVolumeEntities,
  imageDict: ImageEntities,
  planeDict: PlaneEntities,
  chMetaDict: ChannelMetaEntities,
  chs: Channel[],
  catDict: CategoryEntities,
): ExtendedAnnotationObject | null => {
  if (!ann) return null;
  const vol = volumeDict[ann.volumeId];
  if (!vol) return null;
  const image = imageDict[vol.imageId];
  if (!image) return null;
  const plane = planeDict[ann.planeId];
  if (!plane) return null;
  const category = catDict[vol.categoryId];
  if (!category) return null;
  const channels = chs.reduce((extChs: ExtendedChannel[], ch) => {
    const meta = chMetaDict[ch.channelMetaId];
    if (ch.planeId !== plane.id || !meta || !meta.visible) return extChs;
    extChs.push({
      ...ch,
      colorMap: meta.colorMap,
      rampMin: meta.rampMin,
      rampMax: meta.rampMax,
    });

    return extChs;
  }, []);
  if (channels.length === 0) return null;
  return {
    ...ann,
    kindId: vol.kindId,
    categoryId: category.id,
    category: category,
    channelsRef: channels,
    planeIdx: plane.zIndex,
    imageId: image.id,
    imageName: image.name,
  };
};
export const selectExtendedAnnotationById = createSelector(
  [
    annotationSelectors.selectEntities,
    annotationVolumeSelectors.selectEntities,
    imageSelectors.selectEntities,
    planeSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    channelSelectors.selectAll,
    categorySelectors.selectEntities,
    (_: RootState, id: string) => id,
  ],
  (
    annDict,
    annVols,
    imageDict,
    planeDict,
    chMetaDict,
    chs,
    catDict,
    annId,
  ): ExtendedAnnotationObject | null => {
    return buildExtendedAnnotation(
      annDict[annId],
      annVols,
      imageDict,
      planeDict,
      chMetaDict,
      chs,
      catDict,
    );
  },
);

export const selectExtendedAnnotationsByKindId = createSelector(
  [
    annotationSelectors.selectAll,
    annotationVolumeSelectors.selectEntities,
    planeSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    channelSelectors.selectAll,
    categorySelectors.selectEntities,
    imageSelectors.selectEntities,
    (_: RootState, kindId: string) => kindId,
  ],
  (
    anns,
    annVols,
    planeDict,
    chMetaDict,
    chs,
    catDict,
    imageDict,
    kindId,
  ): ExtendedAnnotationObject[] => {
    const extAnns: ExtendedAnnotationObject[] = [];
    anns.forEach((ann) => {
      const vol = annVols[ann.volumeId];
      if (!vol || vol.kindId !== kindId) return;
      const extAnn = buildExtendedAnnotation(
        ann,
        annVols,
        imageDict,
        planeDict,
        chMetaDict,
        chs,
        catDict,
      );
      if (!extAnn) return;
      extAnns.push(extAnn);
    });
    return extAnns;
  },
);

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Annotation Volumes ─────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

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
export const selectAnnotationVolumesByImageId = createSelector(
  [
    annotationVolumeSelectors.selectAll,
    (_: RootState, imageId: string) => imageId,
  ],
  (volumes, imageId) => volumes.filter((v) => v.imageId === imageId),
);

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Planes ─────────────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

export const selectPlanesByImageId = createSelector(
  [planeSelectors.selectAll, (_: RootState, imageId: string) => imageId],
  (planes, imageId) => planes.filter((pl) => pl.imageId === imageId),
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

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Channel Metas ──────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

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

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Categories ─────────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

export const selectCategoriesByKindId = createSelector(
  [categorySelectors.selectAll, (_: RootState, kindId: string) => kindId],
  (categories, kindId) =>
    categories.filter((c) => c.type === "annotation" && c.kindId === kindId),
);

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Channels ───────────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */

// -- Base --

export const selectChannelsByPlaneId = createSelector(
  [channelSelectors.selectAll, (_: RootState, planeId: string) => planeId],
  (channels, planeId) => channels.filter((ch) => ch.planeId === planeId),
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

// -- Extended --

export const selectActiveExtendedChannels = createSelector(
  [
    imageSelectors.selectEntities,
    channelMetaSelectors.selectEntities,
    channelSelectors.selectAll,
    (_: RootState, imageId: string) => imageId,
  ],
  (imageDict, channelMetas, channels, imageId) => {
    const activePlaneId = imageDict[imageId]?.activePlaneId;
    if (!activePlaneId) return [];
    const extChannels: ExtendedChannel[] = [];
    channels.forEach((ch) => {
      const meta = channelMetas[ch.channelMetaId];
      if (ch.planeId !== activePlaneId || !meta || !meta.visible) return;
      extChannels.push({
        ...ch,
        colorMap: meta.colorMap,
        rampMin: meta.rampMin,
        rampMax: meta.rampMax,
      });
    });
    return extChannels;
  },
);

/*
 * ───────────────────────────────────────────────────────────────────────
 * ── Stats ──────────────────────────────────────────────────────────────
 * ───────────────────────────────────────────────────────────────────────
 */
export const selectEntityCountByCategoryId = createSelector(
  imageSelectors.selectAll,
  annotationVolumeSelectors.selectEntities,
  annotationSelectors.selectAll,
  categorySelectors.selectEntities,
  (_: RootState, categoryId: string) => categoryId,
  (ims, annVolDict, anns, catDict, catId) => {
    const cat = catDict[catId];
    if (!cat) {
      console.error("Invalid category id: " + catId);
      return 0;
    }
    if (cat.type === "image")
      return ims.reduce((cnt: number, im) => {
        if (im.categoryId === catId) cnt++;
        return cnt;
      }, 0);
    return anns.reduce((cnt: number, ann) => {
      if (annVolDict[ann.volumeId]?.categoryId === catId) cnt++;
      return cnt;
    }, 0);
  },
);
