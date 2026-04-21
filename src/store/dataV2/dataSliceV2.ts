import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AnnotationCategory,
  ChannelMeta,
  DataStateV2,
  Channel,
  Experiment,
  ImageObject,
  ImageSeries,
  Plane,
  Kind,
  Category,
  AnnotationObject,
  AnnotationVolume,
} from "./types";

import {
  UNKNOWN_IMAGE_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "store/data/constants";
import { generateUUID } from "store/data/utils";
import { Partition } from "utils/models/enums";
import {
  UNKNOWN_KIND,
  UNKNOWN_KIND_CATEGORY,
  UNKNOWN_KIND_CATEGORY_ID,
  UNKNOWN_KIND_ID,
} from "./constants";

export const imageSeriesAdapter = createEntityAdapter<ImageSeries>();
export const imageAdapter = createEntityAdapter<ImageObject>();
export const kindAdapter = createEntityAdapter<Kind>();
export const categoryAdapter = createEntityAdapter<Category>();
export const planeAdapter = createEntityAdapter<Plane>();
export const channelAdapter = createEntityAdapter<Channel>();
export const channelMetaAdapter = createEntityAdapter<ChannelMeta>();
export const annotationAdapter = createEntityAdapter<AnnotationObject>();
export const annotationVolumeAdapter = createEntityAdapter<AnnotationVolume>();

const getInitialExperiment = (): Experiment => ({
  id: generateUUID(),
  name: "New Project",
});
const UNKNOWN_IMAGE_CATEGORY: Category = {
  id: UNKNOWN_IMAGE_CATEGORY_ID,
  name: "Unknown",
  type: "image",
  color: UNKNOWN_IMAGE_CATEGORY_COLOR,
  isUnknown: true,
};

function cascadeDeleteAnnotationVolume(
  state: DataStateV2,
  annVol: AnnotationVolume,
): void {
  const annotationIds = Object.values(state.annotations.entities).reduce(
    (annIds: string[], ann) => {
      if (ann.volumeId === annVol.id) annIds.push(ann.id);
      return annIds;
    },
    [],
  );

  annotationAdapter.removeMany(state.annotations, annotationIds);
}

function cascadeDeleteImage(state: DataStateV2, image: ImageObject): void {
  // cascade: remove all annotation volumes and their child annotations
  const annVols = Object.values(state.annotationVolumes.entities).filter(
    (annVol) => annVol.imageId === image.id,
  );
  annVols.forEach((annVol) => cascadeDeleteAnnotationVolume(state, annVol));

  annotationVolumeAdapter.removeMany(
    state.annotationVolumes,
    annVols.map((vol) => vol.id),
  );
  // cascade: remove all planes and their child channels
  const planeIds = Object.values(state.planes.entities)
    .filter((pl) => pl.imageId === image.id)
    .map((pl) => pl.id);
  const planeSet = new Set(planeIds);
  const channelIds = Object.values(state.channels.entities)
    .filter((ch) => planeSet.has(ch.planeId))
    .map((ch) => ch.id);
  planeAdapter.removeMany(state.planes, planeIds);
  channelAdapter.removeMany(state.channels, channelIds);
}

function cascadeDeleteImageSeries(
  state: DataStateV2,
  series: ImageSeries,
): void {
  const images = Object.values(state.images.entities).filter(
    (im) => im.seriesId === series.id,
  );
  images.forEach((image) => cascadeDeleteImage(state, image));
  imageAdapter.removeMany(
    state.images,
    images.map((im) => im.id),
  );

  const channelMetaIds = Object.values(state.channelMetas.entities).reduce(
    (chMetaIds: string[], chMeta) => {
      if (chMeta.seriesId === series.id) chMetaIds.push(chMeta.id);
      return chMetaIds;
    },
    [],
  );
  channelMetaAdapter.removeMany(state.channelMetas, channelMetaIds);
}

function cascadeDeleteKind(state: DataStateV2, kind: Kind): void {
  const annotationVolumeUpdates = Object.values(
    state.annotationVolumes.entities,
  ).reduce(
    (
      updates: {
        id: string;
        changes: { kindId: string; categoryId: string };
      }[],
      annVol,
    ) => {
      if (annVol.kindId === kind.id)
        updates.push({
          id: annVol.id,
          changes: {
            kindId: UNKNOWN_KIND_ID,
            categoryId: UNKNOWN_KIND_CATEGORY_ID,
          },
        });
      return updates;
    },
    [],
  );
  annotationVolumeAdapter.updateMany(
    state.annotationVolumes,
    annotationVolumeUpdates,
  );

  const categoryIds = Object.values(state.categories.entities).reduce(
    (catIds: string[], cat) => {
      if (cat.type === "annotation" && cat.kindId === kind.id)
        catIds.push(cat.id);
      return catIds;
    },
    [],
  );
  categoryAdapter.removeMany(state.categories, categoryIds);
}

function cascadeDeleteImageCategory(
  state: DataStateV2,
  oldCategoryId: string,
): void {
  const imageUpdates = Object.values(state.images.entities).reduce(
    (updates: { id: string; changes: { categoryId: string } }[], im) => {
      if (im.categoryId === oldCategoryId)
        updates.push({
          id: im.id,
          changes: { categoryId: UNKNOWN_IMAGE_CATEGORY_ID },
        });
      return updates;
    },
    [],
  );
  imageAdapter.updateMany(state.images, imageUpdates);
}

function cascadeDeleteAnnotationCategory(
  state: DataStateV2,
  oldCategoryId: string,
  unknownCategoryId: string,
): void {
  const annotationVolumeUpdates = Object.values(
    state.annotationVolumes.entities,
  ).reduce(
    (
      updates: {
        id: string;
        changes: { categoryId: string };
      }[],
      annVol,
    ) => {
      if (annVol.categoryId === oldCategoryId)
        updates.push({
          id: annVol.id,
          changes: {
            categoryId: unknownCategoryId,
          },
        });
      return updates;
    },
    [],
  );
  annotationVolumeAdapter.updateMany(
    state.annotationVolumes,
    annotationVolumeUpdates,
  );
}

const initialState: DataStateV2 = {
  images: imageAdapter.getInitialState(),
  experiment: getInitialExperiment(),
  imageSeries: imageSeriesAdapter.getInitialState(),
  kinds: kindAdapter.getInitialState({
    ids: [UNKNOWN_KIND_ID],
    entities: {
      [UNKNOWN_KIND_ID]: UNKNOWN_KIND,
    },
  }),
  categories: categoryAdapter.getInitialState({
    ids: [UNKNOWN_IMAGE_CATEGORY_ID, UNKNOWN_KIND_CATEGORY_ID],
    entities: {
      [UNKNOWN_IMAGE_CATEGORY_ID]: UNKNOWN_IMAGE_CATEGORY,
      [UNKNOWN_KIND_CATEGORY_ID]: UNKNOWN_KIND_CATEGORY,
    },
  }),
  planes: planeAdapter.getInitialState(),
  channels: channelAdapter.getInitialState(),
  channelMetas: channelMetaAdapter.getInitialState(),
  annotations: annotationAdapter.getInitialState(),
  annotationVolumes: annotationVolumeAdapter.getInitialState(),
};

export const dataSliceV2 = createSlice({
  name: "dataV2",
  initialState,
  reducers: {
    clearState() {
      return initialState;
    },
    setState(
      state,
      action: PayloadAction<{
        experiment: Experiment;
        images: Array<ImageObject>;
        kinds: Array<Kind>;
        categories: Array<Category>;
        imageSeries: Array<ImageSeries>;
        planes: Array<Plane>;
        channels: Array<Channel>;
        channelMetas: Array<ChannelMeta>;
        annotations: Array<AnnotationObject>;
        annotationVolumes: Array<AnnotationVolume>;
      }>,
    ) {
      const {
        experiment,
        imageSeries,
        images,
        planes,
        channels,
        channelMetas,
        annotations,
        annotationVolumes,
        kinds,
        categories,
      } = action.payload;

      state.experiment = experiment;
      imageSeriesAdapter.setAll(state.imageSeries, imageSeries);
      imageAdapter.setAll(state.images, images);
      planeAdapter.setAll(state.planes, planes);
      channelAdapter.setAll(state.channels, channels);
      channelMetaAdapter.setAll(state.channelMetas, channelMetas);
      annotationAdapter.setAll(state.annotations, annotations);
      annotationVolumeAdapter.setAll(
        state.annotationVolumes,
        annotationVolumes,
      );
      kindAdapter.setAll(state.kinds, kinds);
      kindAdapter.addOne(state.kinds, UNKNOWN_KIND);

      categoryAdapter.setAll(state.categories, categories);
      categoryAdapter.addMany(state.categories, [
        UNKNOWN_IMAGE_CATEGORY,
        UNKNOWN_KIND_CATEGORY,
      ]);
    },
    newExperiment(state, action: PayloadAction<Experiment>) {
      state.experiment = action.payload;
      imageSeriesAdapter.removeAll(state.imageSeries);
      imageAdapter.removeAll(state.images);
      planeAdapter.removeAll(state.planes);
      channelAdapter.removeAll(state.channels);
      channelMetaAdapter.removeAll(state.channelMetas);
      annotationAdapter.removeAll(state.annotations);
      annotationVolumeAdapter.removeAll(state.annotationVolumes);
      kindAdapter.setAll(state.kinds, [UNKNOWN_KIND]);
      categoryAdapter.setAll(state.categories, [
        UNKNOWN_IMAGE_CATEGORY,
        UNKNOWN_KIND_CATEGORY,
      ]);
    },
    updateExperimentName(state, action: PayloadAction<string>) {
      state.experiment.name = action.payload;
    },
    addImageSeries(
      state,
      action: PayloadAction<{
        images: Array<ImageObject>;
        imageSeries: Array<ImageSeries>;
        planes: Array<Plane>;
        channels: Array<Channel>;
        channelMetas: Array<ChannelMeta>;
      }>,
    ) {
      const { imageSeries, images, planes, channels, channelMetas } =
        action.payload;

      imageSeriesAdapter.addMany(state.imageSeries, imageSeries);
      imageAdapter.addMany(state.images, images);
      planeAdapter.addMany(state.planes, planes);
      channelAdapter.addMany(state.channels, channels);
      channelMetaAdapter.addMany(state.channelMetas, channelMetas);
    },
    updateImageSeriesName(
      state,
      action: PayloadAction<{ seriesId: string; name: string }>,
    ) {
      imageSeriesAdapter.updateOne(state.imageSeries, {
        id: action.payload.seriesId,
        changes: { name: action.payload.name },
      });
    },
    updateImageSeriesActiveImage(
      state,
      action: PayloadAction<{ seriesId: string; imageId: string }>,
    ) {
      imageSeriesAdapter.updateOne(state.imageSeries, {
        id: action.payload.seriesId,
        changes: { activeImageId: action.payload.imageId },
      });
    },
    deleteImageSeries(state, action: PayloadAction<string>) {
      const series = state.imageSeries.entities[action.payload];
      if (!series) return;

      cascadeDeleteImageSeries(state, series);
      imageSeriesAdapter.removeOne(state.imageSeries, series.id);
    },
    addImages(
      state,
      action: PayloadAction<{ seriesId: string; images: Array<ImageObject> }>,
    ) {
      const { seriesId, images } = action.payload;
      if (!state.imageSeries.ids.includes(seriesId)) return;
      const imageNames = Object.values(state.images.entities).map(
        (im) => im.name,
      );
      const namedImages = images.map((im) => {
        let imageName = im.name;
        let count = 1;
        while (imageNames.includes(imageName)) {
          imageName = im.name + "(" + count + ")";
          count++;
        }
        imageNames.push(imageName);
        return imageName === im.name ? im : { ...im, name: imageName };
      });
      imageAdapter.addMany(state.images, namedImages);
    },
    updateImageName(
      state,
      action: PayloadAction<{ imageId: string; name: string }>,
    ) {
      imageAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: { name: action.payload.name },
      });
    },
    updateImageActivePlane(
      state,
      action: PayloadAction<{ imageId: string; planeId: string }>,
    ) {
      imageAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: { activePlaneId: action.payload.planeId },
      });
    },
    updateImagePartition(
      state,
      action: PayloadAction<{ imageId: string; partition: Partition }>,
    ) {
      imageAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: { partition: action.payload.partition },
      });
    },
    updateImageCategory(
      state,
      action: PayloadAction<{ imageId: string; categoryId: string }>,
    ) {
      const image = state.images.entities[action.payload.imageId];
      const targetCategory =
        state.categories.entities[action.payload.categoryId];
      if (
        !image ||
        image.categoryId === action.payload.categoryId ||
        !targetCategory
      )
        return;

      imageAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: { categoryId: action.payload.categoryId },
      });
    },
    batchUpdateImageCategory(
      state,
      action: PayloadAction<Array<{ imageId: string; categoryId: string }>>,
    ) {
      const updates: { id: string; changes: { categoryId: string } }[] = [];
      action.payload.forEach(({ imageId, categoryId }) => {
        const image = state.images.entities[imageId];
        const targetCategory = state.categories.entities[categoryId];
        if (!image || image.categoryId === categoryId || !targetCategory)
          return;
        updates.push({ id: image.id, changes: { categoryId } });
      });
      imageAdapter.updateMany(state.images, updates);
    },
    deleteImageObject(state, action: PayloadAction<string>) {
      const image = state.images.entities[action.payload];
      if (!image) return;
      cascadeDeleteImage(state, image);

      imageAdapter.removeOne(state.images, image.id);
    },
    batchDeleteImageObject(state, action: PayloadAction<Array<string>>) {
      const images = action.payload
        .map((id) => state.images.entities[id])
        .filter(Boolean) as ImageObject[];
      images.forEach((image) => cascadeDeleteImage(state, image));

      imageAdapter.removeMany(state.images, action.payload);
    },
    addKind(state, action: PayloadAction<Kind>) {
      kindAdapter.addOne(state.kinds, action.payload);
    },
    batchAddKind(state, action: PayloadAction<Array<Kind>>) {
      kindAdapter.addMany(state.kinds, action.payload);
    },
    updateKindName(
      state,
      action: PayloadAction<{ kindId: string; name: string }>,
    ) {
      kindAdapter.updateOne(state.kinds, {
        id: action.payload.kindId,
        changes: { name: action.payload.name },
      });
    },
    deleteKind(state, action: PayloadAction<string>) {
      const kind = state.kinds.entities[action.payload];
      if (!kind) return;
      if (kind.id === UNKNOWN_KIND_ID) return;

      cascadeDeleteKind(state, kind);
      kindAdapter.removeOne(state.kinds, kind.id);
    },
    addCategory(state, action: PayloadAction<Category>) {
      categoryAdapter.addOne(state.categories, action.payload);
    },
    batchAddCategory(state, action: PayloadAction<Array<Category>>) {
      categoryAdapter.addMany(state.categories, action.payload);
    },
    updateCategoryName(
      state,
      action: PayloadAction<{ categoryId: string; name: string }>,
    ) {
      categoryAdapter.updateOne(state.categories, {
        id: action.payload.categoryId,
        changes: { name: action.payload.name },
      });
    },
    deleteImageCategory(state, action: PayloadAction<string>) {
      const categoryId = action.payload;
      const category = state.categories.entities[categoryId];
      // unknown category is protected — it cannot be deleted
      if (
        categoryId === UNKNOWN_IMAGE_CATEGORY_ID ||
        !category ||
        category.type !== "image"
      )
        return;

      cascadeDeleteImageCategory(state, categoryId);
      categoryAdapter.removeOne(state.categories, categoryId);
    },
    deleteAnnotationCategory(state, action: PayloadAction<string>) {
      const categoryId = action.payload;
      const category = state.categories.entities[categoryId] as
        | AnnotationCategory
        | undefined;
      if (!category || category.type !== "annotation") return;
      const kind = state.kinds.entities[category.kindId];
      // unknown category for a kind is protected — it cannot be deleted
      if (!kind || categoryId === kind.unknownCategoryId) return;

      // reassign all annotation volumes in this category to the kind's unknown category
      cascadeDeleteAnnotationCategory(
        state,
        categoryId,
        kind.unknownCategoryId,
      );
      categoryAdapter.removeOne(state.categories, categoryId);
    },
    addAnnotation(state, action: PayloadAction<AnnotationObject>) {
      annotationAdapter.addOne(state.annotations, action.payload);
    },
    batchAddAnnotation(state, action: PayloadAction<Array<AnnotationObject>>) {
      annotationAdapter.addMany(state.annotations, action.payload);
    },
    updateAnnotationPartition(
      state,
      action: PayloadAction<{ annotationId: string; partition: Partition }>,
    ) {
      annotationAdapter.updateOne(state.annotations, {
        id: action.payload.annotationId,
        changes: { partition: action.payload.partition },
      });
    },
    deleteAnnotation(state, action: PayloadAction<string>) {
      const annotation = state.annotations.entities[action.payload];
      if (!annotation) return;
      annotationAdapter.removeOne(state.annotations, annotation.id);
    },
    batchDeleteAnnotation(state, action: PayloadAction<Array<string>>) {
      annotationAdapter.removeMany(state.annotations, action.payload);
    },
    addAnnotationVolume(state, action: PayloadAction<AnnotationVolume>) {
      annotationVolumeAdapter.addOne(state.annotationVolumes, action.payload);
    },
    batchAddAnnotationVolume(
      state,
      action: PayloadAction<Array<AnnotationVolume>>,
    ) {
      annotationVolumeAdapter.addMany(state.annotationVolumes, action.payload);
    },
    updateAnnotationVolumeCategory(
      state,
      action: PayloadAction<{ volumeId: string; categoryId: string }>,
    ) {
      const volume = state.annotationVolumes.entities[action.payload.volumeId];
      const targetCategory =
        state.categories.entities[action.payload.categoryId];

      if (
        !volume ||
        volume.categoryId === action.payload.categoryId ||
        !targetCategory
      )
        return;

      annotationVolumeAdapter.updateOne(state.annotationVolumes, {
        id: action.payload.volumeId,
        changes: { categoryId: action.payload.categoryId },
      });
    },
    batchUpdateAnnotationVolumeCategory(
      state,
      action: PayloadAction<Array<{ volumeId: string; categoryId: string }>>,
    ) {
      const updates: { id: string; changes: { categoryId: string } }[] = [];
      action.payload.forEach(({ volumeId, categoryId }) => {
        const volume = state.annotationVolumes.entities[volumeId];
        const targetCategory = state.categories.entities[categoryId];
        if (!volume || volume.categoryId === categoryId || !targetCategory)
          return;
        updates.push({ id: volumeId, changes: { categoryId } });
      });
      annotationVolumeAdapter.updateMany(state.annotationVolumes, updates);
    },
    updateAnnotationVolumeKind(
      state,
      action: PayloadAction<{ volumeId: string; kindId: string }>,
    ) {
      const volume = state.annotationVolumes.entities[action.payload.volumeId];
      const newKind = state.kinds.entities[action.payload.kindId];
      if (!volume || volume.kindId === action.payload.kindId || !newKind)
        return;

      annotationVolumeAdapter.updateOne(state.annotationVolumes, {
        id: action.payload.volumeId,
        changes: {
          kindId: action.payload.kindId,
          categoryId: newKind.unknownCategoryId,
        },
      });
    },

    batchUpdateAnnotationVolumeKind(
      state,
      action: PayloadAction<Array<{ volumeId: string; kindId: string }>>,
    ) {
      const updates: {
        id: string;
        changes: { kindId: string; categoryId: string };
      }[] = [];
      action.payload.forEach(({ volumeId, kindId }) => {
        const volume = state.annotationVolumes.entities[volumeId];
        const newKind = state.kinds.entities[kindId];
        if (!volume || volume.kindId === kindId || !newKind) return;

        updates.push({
          id: volume.id,
          changes: {
            kindId: newKind.id,
            categoryId: newKind.unknownCategoryId,
          },
        });
      });
      annotationVolumeAdapter.updateMany(state.annotationVolumes, updates);
    },
    deleteAnnotationVolume(state, action: PayloadAction<string>) {
      const annVol = state.annotationVolumes.entities[action.payload];
      if (!annVol) return;
      cascadeDeleteAnnotationVolume(state, annVol);

      annotationVolumeAdapter.removeOne(state.annotationVolumes, annVol.id);
    },
    batchDeleteAnnotationVolume(state, action: PayloadAction<Array<string>>) {
      const annVols = action.payload
        .map((id) => state.annotationVolumes.entities[id])
        .filter(Boolean) as AnnotationVolume[];
      annVols.forEach((annVol) => cascadeDeleteAnnotationVolume(state, annVol));

      annotationVolumeAdapter.removeMany(
        state.annotationVolumes,
        action.payload,
      );
    },

    updateChannelMeta(
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<
          Pick<
            ChannelMeta,
            | "visible"
            | "colorMap"
            | "rampMin"
            | "rampMax"
            | "rampMinLimit"
            | "rampMaxLimit"
          >
        >;
      }>,
    ) {
      const { id, changes } = action.payload;
      channelMetaAdapter.updateOne(state.channelMetas, { id, changes });
    },
    batchUpdateChannelMeta(
      state,
      action: PayloadAction<
        Array<{
          id: string;
          changes: Partial<
            Pick<
              ChannelMeta,
              | "visible"
              | "colorMap"
              | "rampMin"
              | "rampMax"
              | "rampMinLimit"
              | "rampMaxLimit"
            >
          >;
        }>
      >,
    ) {
      const changes = action.payload;
      channelMetaAdapter.updateMany(state.channelMetas, changes);
    },
  },
});
