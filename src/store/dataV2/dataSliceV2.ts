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
  DataRelationships,
} from "./types";
import {
  moveRelationship,
  pushRelationship,
  removeAnnotationRelationships,
  removeAnnotationVolumeRelationships,
  removeImageRelationships,
  removeRelationship,
  updateAnnotationRelationships,
  updateAnnotationVolumeRelationships,
  updateCategoryRelationships,
  updateChannelMetaRelationships,
  updateChannelRelationships,
  updateImageRelationships,
  updatePlaneRelationships,
} from "./utils";
import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "store/data/constants";
import { generateUUID } from "store/data/utils";
import { Partition } from "utils/models/enums";

const imageSeriesAdapter = createEntityAdapter<ImageSeries>();
const imageAdapter = createEntityAdapter<ImageObject>();
const kindAdapter = createEntityAdapter<Kind>();
const categoryAdapter = createEntityAdapter<Category>();
const planeAdapter = createEntityAdapter<Plane>();
const channelAdapter = createEntityAdapter<Channel>();
const channelMetaAdapter = createEntityAdapter<ChannelMeta>();
const annotationAdapter = createEntityAdapter<AnnotationObject>();
const annotationVolumeAdapter = createEntityAdapter<AnnotationVolume>();

const getInitialRelationships = (): DataRelationships => ({
  imageSeries: {},
  channelMetas: {},
  images: {},
  planes: {},
  kinds: {
    [UNKNOWN_KIND_ID]: {
      annotationVolumeIds: [],
      categoryIds: [UNKNOWN_KIND_CATEGORY_ID],
    },
  },
  imageCategories: { [UNKNOWN_IMAGE_CATEGORY_ID]: { imageIds: [] } },
  annotationCategories: {
    [UNKNOWN_KIND_CATEGORY_ID]: { annotationVolumeIds: [] },
  },
  annotationVolumes: {},
});

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

const UNKNOWN_KIND_CATEGORY_ID = generateUUID({ definesUnknown: true });
const UNKNOWN_KIND_ID = generateUUID({ definesUnknown: true });
const UNKNOWN_KIND: Kind = {
  id: UNKNOWN_KIND_ID,
  name: "Unknown",
  unknownCategoryId: UNKNOWN_KIND_CATEGORY_ID,
};
const UNKNOWN_KIND_CATEGORY: Category = {
  id: UNKNOWN_KIND_CATEGORY_ID,
  name: "Unknown",
  type: "annotation",
  kindId: UNKNOWN_KIND_ID,
  isUnknown: true,
  color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
};

function cascadeDeleteAnnotationVolume(
  state: DataStateV2,
  annVol: AnnotationVolume,
): void {
  const annVolRel = state.relationships.annotationVolumes[annVol.id];
  if (annVolRel) {
    // snapshot before removeAnnotationRelationships mutates annotationIds in-place
    const annotationIds = [...annVolRel.annotationIds];
    // cascade: remove all child annotations and their plane/volume relationship entries
    const annotations = annotationIds
      .map((id) => state.annotations.entities[id])
      .filter(Boolean) as AnnotationObject[];
    removeAnnotationRelationships(state.relationships, annotations);
    annotationAdapter.removeMany(state.annotations, annotationIds);
    delete state.relationships.annotationVolumes[annVol.id];
  }
}

function cascadeDeleteImage(state: DataStateV2, image: ImageObject): void {
  const imageRel = state.relationships.images[image.id];
  if (imageRel) {
    // cascade: remove all annotation volumes and their child annotations
    const annVols = imageRel.annotationVolumeIds
      .map((id) => state.annotationVolumes.entities[id])
      .filter(Boolean) as AnnotationVolume[];
    annVols.forEach((annVol) => cascadeDeleteAnnotationVolume(state, annVol));
    // boundary: remove each annotation volume from its kind and category entries
    annVols.forEach((annVol) => {
      removeRelationship(
        state.relationships.kinds,
        annVol.kindId,
        "annotationVolumeIds",
        annVol.id,
      );
      removeRelationship(
        state.relationships.annotationCategories,
        annVol.categoryId,
        "annotationVolumeIds",
        annVol.id,
      );
    });
    annotationVolumeAdapter.removeMany(
      state.annotationVolumes,
      imageRel.annotationVolumeIds,
    );
    // cascade: remove all planes and their child channels
    imageRel.planeIds.forEach((planeId) => {
      const planeRel = state.relationships.planes[planeId];
      if (planeRel) {
        channelAdapter.removeMany(state.channels, planeRel.channelIds);
        delete state.relationships.planes[planeId];
      }
    });
    planeAdapter.removeMany(state.planes, imageRel.planeIds);
    delete state.relationships.images[image.id];
  }
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
  relationships: getInitialRelationships(),
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

      updateImageRelationships(state.relationships, images);
      updateChannelMetaRelationships(state.relationships, channelMetas);
      updatePlaneRelationships(state.relationships, planes);
      updateAnnotationVolumeRelationships(
        state.relationships,
        annotationVolumes,
      );
      updateCategoryRelationships(state.relationships, categories);
      updateChannelRelationships(state.relationships, channels);
      updateAnnotationRelationships(state.relationships, annotations);

      state.experiment = experiment;
      imageSeriesAdapter.addMany(state.imageSeries, imageSeries);
      imageAdapter.addMany(state.images, images);
      planeAdapter.addMany(state.planes, planes);
      channelAdapter.addMany(state.channels, channels);
      channelMetaAdapter.addMany(state.channelMetas, channelMetas);
      annotationAdapter.addMany(state.annotations, annotations);
      annotationVolumeAdapter.addMany(
        state.annotationVolumes,
        annotationVolumes,
      );
      kindAdapter.addMany(state.kinds, kinds);
      categoryAdapter.addMany(state.categories, categories);
    },
    newExperiment(state, action: PayloadAction<Experiment>) {
      state.experiment = action.payload;
      state.relationships = getInitialRelationships();
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

      updateImageRelationships(state.relationships, images);
      updateChannelMetaRelationships(state.relationships, channelMetas);
      updatePlaneRelationships(state.relationships, planes);
      updateChannelRelationships(state.relationships, channels);

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
      const seriesRel = state.relationships.imageSeries[series.id];
      if (seriesRel) {
        // cascade: for each image, remove annotation volumes, annotations, planes, and channels
        const imageIds = [...seriesRel.imageIds];
        const images = imageIds
          .map((id) => state.images.entities[id])
          .filter(Boolean) as ImageObject[];
        images.forEach((image) => cascadeDeleteImage(state, image));
        // boundary: remove all images from their parent category entries
        removeImageRelationships(state.relationships, images);

        imageAdapter.removeMany(state.images, imageIds);
        // cascade: remove channelMetas owned by this series
        seriesRel.channelMetaIds.forEach((chMetaId) => {
          delete state.relationships.channelMetas[chMetaId];
        });
        channelMetaAdapter.removeMany(
          state.channelMetas,
          seriesRel.channelMetaIds,
        );
        delete state.relationships.imageSeries[series.id];
      }
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
      updateImageRelationships(state.relationships, namedImages);
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
      if (!state.relationships.imageCategories[targetCategory.id])
        state.relationships.imageCategories[targetCategory.id] = {
          imageIds: [],
        };
      moveRelationship(
        state.relationships.imageCategories,
        "imageIds",
        action.payload.imageId,
        image.categoryId,
        action.payload.categoryId,
      );
      imageAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: { categoryId: action.payload.categoryId },
      });
    },
    batchUpdateImageCategory(
      state,
      action: PayloadAction<Array<{ imageId: string; categoryId: string }>>,
    ) {
      action.payload.forEach(({ imageId, categoryId }) => {
        const image = state.images.entities[imageId];
        const targetCategory = state.categories.entities[categoryId];
        if (!image || image.categoryId === categoryId || !targetCategory)
          return;
        if (!state.relationships.imageCategories[targetCategory.id])
          state.relationships.imageCategories[targetCategory.id] = {
            imageIds: [],
          };
        moveRelationship(
          state.relationships.imageCategories,
          "imageIds",
          imageId,
          image.categoryId,
          categoryId,
        );
      });
      imageAdapter.updateMany(
        state.images,
        action.payload.map(({ imageId, categoryId }) => ({
          id: imageId,
          changes: { categoryId },
        })),
      );
    },
    deleteImageObject(state, action: PayloadAction<string>) {
      const image = state.images.entities[action.payload];
      if (!image) return;
      cascadeDeleteImage(state, image);
      // boundary: remove this image from its parent series and category entries
      removeImageRelationships(state.relationships, [image]);
      imageAdapter.removeOne(state.images, image.id);
    },
    batchDeleteImageObject(state, action: PayloadAction<Array<string>>) {
      const images = action.payload
        .map((id) => state.images.entities[id])
        .filter(Boolean) as ImageObject[];
      images.forEach((image) => cascadeDeleteImage(state, image));
      // boundary: remove all images from their parent series and category entries
      removeImageRelationships(state.relationships, images);
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
      const kindRel = state.relationships.kinds[kind.id];
      if (kindRel) {
        kindRel.annotationVolumeIds.forEach((annVolId) => {
          const annVol = state.annotationVolumes.entities[annVolId];
          if (!annVol) return;
          annVol.kindId = UNKNOWN_KIND_ID;
          annVol.categoryId = UNKNOWN_KIND_CATEGORY_ID;
          pushRelationship(
            state.relationships.kinds as DataRelationships["kinds"],
            UNKNOWN_KIND_ID,
            () => ({ annotationVolumeIds: [], categoryIds: [] }),
            (e) => e.annotationVolumeIds.push(annVolId),
          );
          pushRelationship(
            state.relationships
              .annotationCategories as DataRelationships["annotationCategories"],
            UNKNOWN_KIND_CATEGORY_ID,
            () => ({ annotationVolumeIds: [] }),
            (e) => e.annotationVolumeIds.push(annVolId),
          );
        });
        kindRel.categoryIds.forEach(
          (catId) => delete state.relationships.annotationCategories[catId],
        );
        categoryAdapter.removeMany(state.categories, kindRel.categoryIds);
        delete state.relationships.kinds[kind.id];
      }
      kindAdapter.removeOne(state.kinds, kind.id);
    },
    addCategory(state, action: PayloadAction<Category>) {
      updateCategoryRelationships(state.relationships, [action.payload]);
      categoryAdapter.addOne(state.categories, action.payload);
    },
    batchAddCategory(state, action: PayloadAction<Array<Category>>) {
      updateCategoryRelationships(state.relationships, action.payload);
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
      // unknown category is protected — it cannot be deleted
      if (categoryId === UNKNOWN_IMAGE_CATEGORY_ID) return;
      const catRel = state.relationships.imageCategories[categoryId];
      if (catRel) {
        // reassign all images in this category to the unknown category
        catRel.imageIds.forEach((imageId) => {
          const image = state.images.entities[imageId];
          if (!image) return;
          image.categoryId = UNKNOWN_IMAGE_CATEGORY_ID;
          pushRelationship(
            state.relationships.imageCategories,
            UNKNOWN_IMAGE_CATEGORY_ID,
            () => ({ imageIds: [] as string[] }),
            (e) => e.imageIds.push(imageId),
          );
        });
        delete state.relationships.imageCategories[categoryId];
      }
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
      const catRel = state.relationships.annotationCategories[categoryId];
      if (catRel) {
        // reassign all annotation volumes in this category to the kind's unknown category
        catRel.annotationVolumeIds.forEach((annVolId) => {
          const annVol = state.annotationVolumes.entities[annVolId];
          if (!annVol) return;
          annVol.categoryId = kind.unknownCategoryId;
          pushRelationship(
            state.relationships.annotationCategories,
            kind.unknownCategoryId,
            () => ({ annotationVolumeIds: [] as string[] }),
            (e) => e.annotationVolumeIds.push(annVolId),
          );
        });
        delete state.relationships.annotationCategories[categoryId];
      }
      // boundary: remove this category from its parent kind entry
      removeRelationship(
        state.relationships.kinds,
        category.kindId,
        "categoryIds",
        categoryId,
      );
      categoryAdapter.removeOne(state.categories, categoryId);
    },
    addAnnotation(state, action: PayloadAction<AnnotationObject>) {
      updateAnnotationRelationships(state.relationships, [action.payload]);
      annotationAdapter.addOne(state.annotations, action.payload);
    },
    batchAddAnnotation(state, action: PayloadAction<Array<AnnotationObject>>) {
      updateAnnotationRelationships(state.relationships, action.payload);
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
      removeAnnotationRelationships(state.relationships, [annotation]);
      annotationAdapter.removeOne(state.annotations, annotation.id);
    },
    batchDeleteAnnotation(state, action: PayloadAction<Array<string>>) {
      const annotations = action.payload
        .map((id) => state.annotations.entities[id])
        .filter(Boolean) as AnnotationObject[];
      removeAnnotationRelationships(state.relationships, annotations);
      annotationAdapter.removeMany(state.annotations, action.payload);
    },
    addAnnotationVolume(state, action: PayloadAction<AnnotationVolume>) {
      updateAnnotationVolumeRelationships(state.relationships, [
        action.payload,
      ]);
      annotationVolumeAdapter.addOne(state.annotationVolumes, action.payload);
    },
    batchAddAnnotationVolume(
      state,
      action: PayloadAction<Array<AnnotationVolume>>,
    ) {
      updateAnnotationVolumeRelationships(state.relationships, action.payload);
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
      if (!state.relationships.annotationCategories[targetCategory.id])
        state.relationships.annotationCategories[targetCategory.id] = {
          annotationVolumeIds: [],
        };

      moveRelationship(
        state.relationships.annotationCategories,
        "annotationVolumeIds",
        action.payload.volumeId,
        volume.categoryId,
        action.payload.categoryId,
      );
      annotationVolumeAdapter.updateOne(state.annotationVolumes, {
        id: action.payload.volumeId,
        changes: { categoryId: action.payload.categoryId },
      });
    },
    batchUpdateAnnotationVolumeCategory(
      state,
      action: PayloadAction<Array<{ volumeId: string; categoryId: string }>>,
    ) {
      action.payload.forEach(({ volumeId, categoryId }) => {
        const volume = state.annotationVolumes.entities[volumeId];
        const targetCategory = state.categories.entities[categoryId];
        if (!volume || volume.categoryId === categoryId || !targetCategory)
          return;
        if (!state.relationships.annotationCategories[targetCategory.id])
          state.relationships.annotationCategories[targetCategory.id] = {
            annotationVolumeIds: [],
          };
        moveRelationship(
          state.relationships.annotationCategories,
          "annotationVolumeIds",
          volumeId,
          volume.categoryId,
          categoryId,
        );
      });
      annotationVolumeAdapter.updateMany(
        state.annotationVolumes,
        action.payload.map(({ volumeId, categoryId }) => ({
          id: volumeId,
          changes: { categoryId },
        })),
      );
    },
    updateAnnotationVolumeKind(
      state,
      action: PayloadAction<{ volumeId: string; kindId: string }>,
    ) {
      const volume = state.annotationVolumes.entities[action.payload.volumeId];
      const newKind = state.kinds.entities[action.payload.kindId];
      if (!volume || volume.kindId === action.payload.kindId || !newKind)
        return;
      if (!state.relationships.kinds[newKind.id])
        state.relationships.kinds[newKind.id] = {
          annotationVolumeIds: [],
          categoryIds: [newKind.unknownCategoryId],
        };
      if (!state.relationships.annotationCategories[newKind.unknownCategoryId])
        state.relationships.annotationCategories[newKind.unknownCategoryId] = {
          annotationVolumeIds: [],
        };
      moveRelationship(
        state.relationships.kinds,
        "annotationVolumeIds",
        action.payload.volumeId,
        volume.kindId,
        action.payload.kindId,
      );
      // reset category to the new kind's unknown — old category doesn't belong to new kind
      moveRelationship(
        state.relationships.annotationCategories,
        "annotationVolumeIds",
        action.payload.volumeId,
        volume.categoryId,
        newKind.unknownCategoryId,
      );
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
        if (!state.relationships.kinds[newKind.id])
          state.relationships.kinds[newKind.id] = {
            annotationVolumeIds: [],
            categoryIds: [newKind.unknownCategoryId],
          };
        if (
          !state.relationships.annotationCategories[newKind.unknownCategoryId]
        )
          state.relationships.annotationCategories[newKind.unknownCategoryId] =
            {
              annotationVolumeIds: [],
            };
        moveRelationship(
          state.relationships.kinds,
          "annotationVolumeIds",
          volumeId,
          volume.kindId,
          kindId,
        );
        // reset category to the new kind's unknown — old category doesn't belong to new kind
        moveRelationship(
          state.relationships.annotationCategories,
          "annotationVolumeIds",
          volumeId,
          volume.categoryId,
          newKind.unknownCategoryId,
        );
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
      // boundary: remove this volume from its parent image, kind, and category entries
      removeAnnotationVolumeRelationships(state.relationships, [annVol]);
      annotationVolumeAdapter.removeOne(state.annotationVolumes, annVol.id);
    },
    batchDeleteAnnotationVolume(state, action: PayloadAction<Array<string>>) {
      const annVols = action.payload
        .map((id) => state.annotationVolumes.entities[id])
        .filter(Boolean) as AnnotationVolume[];
      annVols.forEach((annVol) => cascadeDeleteAnnotationVolume(state, annVol));
      // boundary: remove all volumes from their parent image, kind, and category entries
      removeAnnotationVolumeRelationships(state.relationships, annVols);
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
