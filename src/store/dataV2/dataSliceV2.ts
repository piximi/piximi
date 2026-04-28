import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import { generateUUID } from "store/dataV2/utils";

import { Partition } from "utils/modelsV2/enums";
import type { AtLeastOne } from "utils/types";
import { representsUnknown } from "utils/stringUtils";

import {
  UNKNOWN_IMAGE_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND,
  UNKNOWN_KIND_CATEGORY,
  UNKNOWN_KIND_CATEGORY_ID,
  UNKNOWN_KIND_ID,
} from "./constants";

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
import type { PayloadAction } from "@reduxjs/toolkit";

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

function batchBubbleDeleteAnnotation(
  state: DataStateV2,
  annotations: AnnotationObject[],
) {
  const annIds: string[] = [];
  const volumeIds = new Set<string>();
  annotations.forEach((ann) => {
    annIds.push(ann.id);
    volumeIds.add(ann.volumeId);
  });
  annotationAdapter.removeMany(state.annotations, annIds);

  Object.values(state.annotations.entities).forEach((ann) => {
    if (volumeIds.has(ann.volumeId)) volumeIds.delete(ann.volumeId);
  });

  if (volumeIds.size > 0) {
    annotationVolumeAdapter.removeMany(state.annotationVolumes, [...volumeIds]);
  }
}

function bubbleDeleteAnnotation(
  state: DataStateV2,
  annotation: AnnotationObject,
) {
  const { volumeId } = annotation;
  annotationAdapter.removeOne(state.annotations, annotation.id);
  const volumeStillHasAnnotations = Object.values(
    state.annotations.entities,
  ).some((a) => a?.volumeId === volumeId);
  if (!volumeStillHasAnnotations) {
    annotationVolumeAdapter.removeOne(state.annotationVolumes, volumeId);
  }
}

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
      categoryAdapter.setAll(state.categories, categories);
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
      action: PayloadAction<{ id: string; partition: Partition }>,
    ) {
      imageAdapter.updateOne(state.images, {
        id: action.payload.id,
        changes: { partition: action.payload.partition },
      });
    },
    batchUpdateImagePartition(
      state,
      action: PayloadAction<Array<{ id: string; partition: Partition }>>,
    ) {
      const updates: { id: string; changes: { partition: Partition } }[] = [];
      action.payload.forEach(({ id, partition }) => {
        const image = state.images.entities[id];
        if (!image || image.categoryId === partition) return;
        updates.push({ id, changes: { partition } });
      });
      imageAdapter.updateMany(state.images, updates);
    },
    updateImageCategory(
      state,
      action: PayloadAction<{
        id: string;
        categoryId: string;
        predicted?: boolean;
      }>,
    ) {
      const image = state.images.entities[action.payload.id];
      if (!image) return;
      const newCatId = action.payload.categoryId;
      if (image.categoryId === newCatId) return;
      const targetCategory = state.categories.entities[newCatId];
      if (!targetCategory) return;
      const newPartition = action.payload.predicted
        ? image.partition
        : representsUnknown(newCatId)
          ? Partition.Inference
          : Partition.Unassigned;

      imageAdapter.updateOne(state.images, {
        id: action.payload.id,
        changes: { categoryId: newCatId, partition: newPartition },
      });
    },
    batchUpdateImageCategory(
      state,
      action: PayloadAction<
        Array<{ id: string; categoryId: string; predicted?: boolean }>
      >,
    ) {
      const updates: {
        id: string;
        changes: { categoryId: string; partition: Partition };
      }[] = [];
      action.payload.forEach(({ id, categoryId: catId, predicted }) => {
        const image = state.images.entities[id];
        if (!image) return;
        const targetCategory = state.categories.entities[catId];
        if (!targetCategory) return;
        const newPartition = predicted
          ? image.partition
          : representsUnknown(catId)
            ? Partition.Inference
            : Partition.Unassigned;
        updates.push({
          id,
          changes: { categoryId: catId, partition: newPartition },
        });
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
    addKind(
      state,
      action: PayloadAction<{ kind: Kind; category: AnnotationCategory }>,
    ) {
      kindAdapter.addOne(state.kinds, action.payload.kind);
      categoryAdapter.addOne(state.categories, action.payload.category);
    },
    batchAddKind(
      state,
      action: PayloadAction<
        Array<{ kind: Kind; category: AnnotationCategory }>
      >,
    ) {
      kindAdapter.addMany(
        state.kinds,
        action.payload.map((pd) => pd.kind),
      );
      categoryAdapter.addMany(
        state.categories,
        action.payload.map((pd) => pd.category),
      );
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
    updateCategoryDisplayProps(
      state,
      action: PayloadAction<{
        id: string;
        changes: AtLeastOne<Pick<Category, "name" | "color">>;
      }>,
    ) {
      categoryAdapter.updateOne(state.categories, {
        id: action.payload.id,
        changes: action.payload.changes,
      });
    },
    deleteCategory(state, action: PayloadAction<string>) {
      const catId = action.payload;
      const category = state.categories.entities[catId];
      // unknown category is protected — it cannot be deleted
      if (!category || catId === UNKNOWN_IMAGE_CATEGORY_ID) return;
      if (category.type === "image") {
        cascadeDeleteImageCategory(state, catId);
        categoryAdapter.removeOne(state.categories, catId);
        return;
      }
      const kind = state.kinds.entities[category.kindId];
      // unknown category for a kind is protected — it cannot be deleted
      if (!kind || catId === kind.unknownCategoryId) return;

      // reassign all annotation volumes in this category to the kind's unknown category
      cascadeDeleteAnnotationCategory(state, catId, kind.unknownCategoryId);
      categoryAdapter.removeOne(state.categories, catId);
    },
    batchDeleteCategory(state, action: PayloadAction<string[]>) {
      action.payload.forEach((catId) => {
        const category = state.categories.entities[catId];
        // unknown category is protected — it cannot be deleted
        if (!category || catId === UNKNOWN_IMAGE_CATEGORY_ID) return;
        if (category.type === "image") {
          cascadeDeleteImageCategory(state, catId);
          categoryAdapter.removeOne(state.categories, catId);
          return;
        }
        const kind = state.kinds.entities[category.kindId];
        // unknown category for a kind is protected — it cannot be deleted
        if (!kind || catId === kind.unknownCategoryId) return;

        // reassign all annotation volumes in this category to the kind's unknown category
        cascadeDeleteAnnotationCategory(state, catId, kind.unknownCategoryId);
        categoryAdapter.removeOne(state.categories, catId);
      });
    },
    deleteEntitiesByCatId(state, action: PayloadAction<string>) {
      const catId = action.payload;
      const category = state.categories.entities[catId];
      if (category.type === "image") {
        const categorizedImages = Object.values(state.images.entities).filter(
          (im) => im.categoryId === catId,
        );
        categorizedImages.forEach((image) => cascadeDeleteImage(state, image));

        imageAdapter.removeMany(
          state.images,
          categorizedImages.map((im) => im.id),
        );
        return;
      }
      const categorizedAnnotations = Object.values(
        state.annotations.entities,
      ).filter(
        (ann) =>
          state.annotationVolumes.entities[ann.volumeId].categoryId === catId,
      );
      batchBubbleDeleteAnnotation(state, categorizedAnnotations);
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
      action: PayloadAction<{ id: string; partition: Partition }>,
    ) {
      annotationAdapter.updateOne(state.annotations, {
        id: action.payload.id,
        changes: { partition: action.payload.partition },
      });
    },
    batchUpdateAnnotationPartition(
      state,
      action: PayloadAction<{ id: string; partition: Partition }[]>,
    ) {
      annotationAdapter.updateMany(
        state.annotations,
        action.payload.map((changes) => ({
          id: changes.id,
          changes: { partition: changes.partition },
        })),
      );
    },
    bubbleUpdateAnnotationCategory(
      state,
      action: PayloadAction<{
        id: string;
        categoryId: string;
        predicted?: boolean;
      }>,
    ) {
      const targetCatId = action.payload.categoryId;
      const annotation = state.annotations.entities[action.payload.id];

      if (!annotation || !state.categories.entities[targetCatId]) return;

      const volume = state.annotationVolumes.entities[annotation.volumeId];
      if (!volume || volume.categoryId === targetCatId) return;

      const partitionUpdates = Object.values(state.annotations.entities)
        .filter((ann) => ann.volumeId === annotation.volumeId)
        .map((ann) => ({
          id: ann.id,
          changes: {
            partition: action.payload.predicted
              ? ann.partition
              : representsUnknown(targetCatId)
                ? Partition.Inference
                : Partition.Unassigned,
          },
        }));

      annotationVolumeAdapter.updateOne(state.annotationVolumes, {
        id: annotation.volumeId,
        changes: { categoryId: action.payload.categoryId },
      });

      annotationAdapter.updateMany(state.annotations, partitionUpdates);
    },
    batchBubbleUpdateAnnotationCategory(
      state,
      action: PayloadAction<
        { id: string; categoryId: string; predicted?: boolean }[]
      >,
    ) {
      const volumeChanges: Record<string, string> = {};
      const partitionUpdates: Array<{
        id: string;
        changes: { partition: Partition };
      }> = [];
      action.payload.forEach(({ id, categoryId: taargetCatId, predicted }) => {
        const ann = state.annotations.entities[id];
        if (!ann || !state.categories.entities[taargetCatId]) return;

        const volume = state.annotationVolumes.entities[ann.volumeId];
        if (!volume || volume.categoryId === taargetCatId) return;

        const volumeAnnUpdates = Object.values(state.annotations.entities)
          .filter((_ann) => _ann.volumeId === ann.volumeId)
          .map((ann) => ({
            id: ann.id,
            changes: {
              partition: predicted
                ? ann.partition
                : representsUnknown(taargetCatId)
                  ? Partition.Inference
                  : Partition.Unassigned,
            },
          }));

        volumeChanges[ann.volumeId] = taargetCatId;
        partitionUpdates.push(...volumeAnnUpdates);
      });

      annotationVolumeAdapter.updateMany(
        state.annotationVolumes,
        Object.entries(volumeChanges).map(([id, categoryId]) => ({
          id,
          changes: { categoryId },
        })),
      );
      annotationAdapter.updateMany(state.annotations, partitionUpdates);
    },
    bubbleUpdateAnnotationKind(
      state,
      action: PayloadAction<{
        id: string;
        kindId: string;
        categoryId?: string;
      }>,
    ) {
      const { id: annId, kindId, categoryId } = action.payload;
      const annotation = state.annotations.entities[annId];
      if (!annotation) return;
      const category =
        categoryId !== undefined
          ? state.categories.entities[categoryId]
          : undefined;
      const kind = state.kinds.entities[kindId];
      if (!kind) return;
      let updatedCategoryId: string;
      if (
        category &&
        category.type === "annotation" &&
        category.kindId === kindId
      )
        updatedCategoryId = category.id;
      else updatedCategoryId = kind.unknownCategoryId;
      annotationVolumeAdapter.updateOne(state.annotationVolumes, {
        id: annotation.volumeId,
        changes: { kindId: kind.id, categoryId: updatedCategoryId },
      });
    },
    batchBubbleUpdateAnnotationKind(
      state,
      action: PayloadAction<{ id: string; kindId: string }[]>,
    ) {
      const volumeChanges: Record<
        string,
        { kindId: string; categoryId: string }
      > = {};
      action.payload.forEach(({ id, kindId }) => {
        const ann = state.annotations.entities[id];
        if (!ann) return;
        const kind = state.kinds.entities[kindId];
        if (!kind) return;
        volumeChanges[ann.volumeId] = {
          kindId,
          categoryId: kind.unknownCategoryId,
        };
      });

      annotationVolumeAdapter.updateMany(
        state.annotationVolumes,
        Object.entries(volumeChanges).map(([id, changes]) => ({
          id,
          changes,
        })),
      );
    },
    deleteAnnotation(state, action: PayloadAction<string>) {
      const annotation = state.annotations.entities[action.payload];
      if (!annotation) return;
      bubbleDeleteAnnotation(state, annotation);
    },
    batchDeleteAnnotation(state, action: PayloadAction<Array<string>>) {
      const annotations = action.payload.map(
        (annId) => state.annotations.entities[annId],
      );
      batchBubbleDeleteAnnotation(state, annotations);
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
