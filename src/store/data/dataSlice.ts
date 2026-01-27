import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";
import { difference } from "lodash";

import { DataState } from "store/types";

import {
  AnnotationObject,
  Category,
  Tracklet,
  ImageMetadata,
  ImageObject,
  Kind,
  ObjectMeasurements,
  ChannelStatistics,
  ChannelData,
  ChannelMeasurements,
  ComputedImageMeasurements,
} from "./types";
import { generateCategory, generateUUID, isUnknownCategory } from "./utils";
import {
  IMAGE_KIND,
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "./constants";
import {
  deleteTrackletCascade,
  removeAnnotationFromTrackletCascade,
  addAnnotationToTrackletCascade,
  joinTrackletsCascade,
  severTrackletCascade,
  deleteAnnotationCascade,
  updateAnnotationCascade,
  addCategoryCascade,
  deleteCategoryCascade,
  deleteImageCascade,
  updateImageCascade,
  addKindCascade,
  deleteKindCascade,
  addTrackletCascade,
} from "./cascade-operations";
import {
  addAnnotationBatch,
  deleteAnnotationBatch,
  updateAnnotationBatch,
  deleteImageDataBatch,
  updateImageDataBatch,
  deleteCategoryBatch,
} from "./batch-operations";
import {
  addAnnotationToAllRelationships,
  addImageToCategoryRelationship,
  addTrackletRelationship,
  removeTrackletRelationship,
} from "./relationship-operations";

// Entity Adapters
export const metadataAdapter = createEntityAdapter<ImageMetadata>();
export const imageDataAdapter = createEntityAdapter<ImageObject>();
export const kindsAdapter = createEntityAdapter<Kind>();
export const categoriesAdapter = createEntityAdapter<Category>();
export const annotationsAdapter = createEntityAdapter<AnnotationObject>();
export const trackletAdapter = createEntityAdapter<Tracklet>();

const unknownImageCategory = generateCategory(
  UNKNOWN_CATEGORY_NAME,
  IMAGE_KIND,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
);
unknownImageCategory.id = generateUUID({ definesUnknown: true });
const imageKind: Kind = {
  id: IMAGE_KIND,
  displayName: IMAGE_KIND,
  unknownCategoryId: unknownImageCategory.id,
};

// Initial state
const initialState: DataState = {
  kinds: kindsAdapter.getInitialState({
    ids: [imageKind.id],
    entities: { [imageKind.id]: imageKind },
  }),
  categories: categoriesAdapter.getInitialState({
    ids: [unknownImageCategory.id],
    entities: { [unknownImageCategory.id]: unknownImageCategory },
  }),
  metadata: metadataAdapter.getInitialState(),
  images: imageDataAdapter.getInitialState(),
  annotations: annotationsAdapter.getInitialState(),
  tracklets: trackletAdapter.getInitialState(),
  relationships: {
    kindToCategories: { [imageKind.id]: [unknownImageCategory.id] },
    kindToAnnotations: {},
    categoryToImages: { [unknownImageCategory.id]: [] },
    categoryToAnnotations: {},
    imageToAnnotations: {},
    metadataToTracklets: {},
  },
};

export const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    // ============== KIND OPERATIONS ==============
    // -- Create
    addKind: (
      state,
      action: PayloadAction<{ kind: Kind; unknownCategory?: Category }>,
    ) => {
      addKindCascade(
        state,
        action.payload.kind,
        action.payload.unknownCategory,
      );
    },
    // -- Update
    updateKindName: (
      state,
      action: PayloadAction<{ id: string; newName: string }>,
    ) => {
      const { id, newName } = action.payload;
      const existingKind = state.kinds.entities[id];

      if (!existingKind) return;

      kindsAdapter.updateOne(state.kinds, {
        id,
        changes: { displayName: newName },
      });
    },
    // -- Delete
    deleteKind: (state, action: PayloadAction<string>) => {
      deleteKindCascade(state, action.payload);
    },

    // ============== CATEGORY OPERATIONS ==============
    // -- Create
    addCategory: (state, action: PayloadAction<Category>) => {
      addCategoryCascade(state, action.payload);
    },
    // -- Update
    updateCategory: (
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<Pick<Category, "name" | "color">>;
      }>,
    ) => {
      const { id, changes } = action.payload;
      const existingCategory = state.categories.entities[id];

      if (!existingCategory) return;

      categoriesAdapter.updateOne(state.categories, { id, changes });
    },
    // -- Delete
    deleteCategory: (state, action: PayloadAction<string>) => {
      deleteCategoryCascade(state, action.payload);
    },

    // ============== METADATA OPERATIONS ==============
    // -- Create
    addMetadata: (
      state,
      action: PayloadAction<{ metadata: ImageMetadata; images: ImageObject[] }>,
    ) => {
      const { metadata, images } = action.payload;

      // validate correct number of images
      if (metadata.imageDataIds.length !== images.length) {
        throw new Error(
          `Metadata specifies ${metadata.imageDataIds.length} images but store only supplied ${images.length}.`,
        );
      }

      // validate id match
      if (
        difference(
          metadata.imageDataIds,
          images.map((image) => image.id),
        ).length !== 0
      ) {
        throw new Error(
          "Image Ids provided in metadata do not match Ids of images provided",
        );
      }

      metadataAdapter.addOne(state.metadata, metadata);
      dataSlice.caseReducers.batchAddImageData(state, {
        payload: images,
        type: "batchAddImage",
      });
      state.relationships.metadataToTracklets[metadata.id] = [];
    },
    // -- Update
    updateDefaultMetadataImage: (
      state,
      action: PayloadAction<{
        metadataId: string;
        defaultImageId: string;
      }>,
    ) => {
      const { metadataId, defaultImageId } = action.payload;
      const existingMetadata = state.metadata.entities[metadataId];
      const existingImage = state.images.entities[defaultImageId];
      if (!existingMetadata) {
        console.error("No metadata with id: ", metadataId);
        return;
      }
      if (!existingImage) {
        console.error("No image with id: ", defaultImageId);
        return;
      }
      if (!existingMetadata.imageDataIds.includes(defaultImageId)) {
        console.error(
          `Image with id: ${defaultImageId} not described by metadata with id ${metadataId}`,
        );
        return;
      }

      metadataAdapter.updateOne(state.metadata, {
        id: metadataId,
        changes: { defaultImageId },
      });
    },

    // ============== IMAGE OPERATIONS ==============
    // -- Create
    addImageData: (state, action: PayloadAction<ImageObject>) => {
      const image = action.payload;
      imageDataAdapter.addOne(state.images, image);

      // Initialize annotation relationship
      state.relationships.imageToAnnotations[image.id] = [];

      // Update category relationships
      addImageToCategoryRelationship(state, image.id, image.categoryId);
    },
    // -- Update
    updateImageData: (
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<Omit<ImageObject, "data">>;
      }>,
    ) => {
      updateImageCascade(state, action.payload.id, action.payload.changes);
    },
    // -- Delete
    deleteImageData: (state, action: PayloadAction<string>) => {
      deleteImageCascade(state, action.payload);
    },
    updateImageComputedMeasurements: (
      state,
      action: PayloadAction<{
        imageId: string;
        measurements: ComputedImageMeasurements;
      }>,
    ) => {
      const { imageId, measurements } = action.payload;
      const image = state.images.entities[imageId];
      if (!image) return;
      if (image.measurements) Object.assign(image.measurements, measurements);
      else image.measurements = { channels: [], ...measurements };
    },
    updateImageChannelMeasurements: (
      state,
      action: PayloadAction<{
        id: string;
        channelMeasurements: ChannelData[];
      }>,
    ) => {
      const { id, channelMeasurements } = action.payload;
      const image = state.images.entities[id];

      if (!image) return;

      let updatedMeasurements: ChannelStatistics;

      if (!image.measurements || image.measurements.channels.length === 0) {
        updatedMeasurements = { channels: channelMeasurements };
      } else {
        const existingChannels = [...image.measurements.channels];
        channelMeasurements.forEach((incoming) => {
          const channelIndex = existingChannels.findIndex(
            (existing) => existing.channelId === incoming.channelId,
          );
          if (channelIndex === -1) {
            existingChannels.push(incoming);
          } else {
            existingChannels[channelIndex] = {
              ...existingChannels[channelIndex],
              ...incoming,
            };
          }
        });
        updatedMeasurements = { channels: existingChannels };
      }

      imageDataAdapter.updateOne(state.images, {
        id,
        changes: { measurements: updatedMeasurements },
      });
    },
    updateImageChannelMeasurementValues: (
      state,
      action: PayloadAction<Record<string, Record<number, ChannelData>>>,
    ) => {
      const updates = action.payload;
      Object.entries(updates).forEach(([imageId, channels]) => {
        const image = state.images.entities[imageId];
        if (!image.measurements?.channels) return;
        Object.entries(channels).forEach(([channelId, measurements]) => {
          Object.assign(
            image.measurements!.channels[+channelId],
            measurements as Partial<ChannelMeasurements>,
          );
        });
      });
    },

    // ============== ANNOTATION OPERATIONS ==============
    // -- Create
    addAnnotation: (state, action: PayloadAction<AnnotationObject>) => {
      const annotation = action.payload;
      annotationsAdapter.addOne(state.annotations, annotation);

      // Update relationships
      addAnnotationToAllRelationships(state, annotation.id, {
        kindId: annotation.kind,
        categoryId: annotation.categoryId,
        imageId: annotation.imageId,
      });
    },
    // -- Update
    updateAnnotation: (
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<
          Omit<
            AnnotationObject,
            "id" | "bitDepth" | "plane" | "imageId" | "timepoint"
          >
        >;
      }>,
    ) => {
      updateAnnotationCascade(state, action.payload.id, action.payload.changes);
    },
    // -- Delete
    deleteAnnotation: (state, action: PayloadAction<string>) => {
      deleteAnnotationCascade(state, action.payload);
    },

    updateAnnotationMeasurements: (
      state,
      action: PayloadAction<{
        annId: string;
        measurements: ObjectMeasurements;
      }>,
    ) => {
      const { channels, ...objectMeasurements } = action.payload.measurements;
      const annotation = state.annotations.entities[action.payload.annId];
      if (!annotation) return;
      if (!annotation.measurements) {
        annotation.measurements = { channels, ...objectMeasurements };
      }

      Object.assign(annotation.measurements, objectMeasurements);
      if (channels) {
        if (!annotation.measurements.channels)
          annotation.measurements.channels = channels;
        else Object.assign(annotation.measurements.channels, channels);
      }
    },
    updateAnnotationChannelMeasurements: (
      state,
      action: PayloadAction<{
        id: string;
        channelMeasurements: ChannelData[];
      }>,
    ) => {
      const { id, channelMeasurements } = action.payload;
      const annotation = state.annotations.entities[id];

      if (!annotation) return;

      let updatedMeasurements: ChannelStatistics;

      if (
        !annotation.measurements ||
        annotation.measurements.channels.length === 0
      ) {
        updatedMeasurements = { channels: channelMeasurements };
      } else {
        const existingChannels = [...annotation.measurements.channels];
        channelMeasurements.forEach((incoming) => {
          const channelIndex = existingChannels.findIndex(
            (existing) => existing.channelId === incoming.channelId,
          );
          if (channelIndex === -1) {
            existingChannels.push(incoming);
          } else {
            existingChannels[channelIndex] = {
              ...existingChannels[channelIndex],
              ...incoming,
            };
          }
        });
        updatedMeasurements = { channels: existingChannels };
      }

      annotationsAdapter.updateOne(state.annotations, {
        id,
        changes: { measurements: updatedMeasurements },
      });
    },
    updateAnnotationChannelMeasurementValues: (
      state,
      action: PayloadAction<Record<string, Record<number, ChannelData>>>,
    ) => {
      const updates = action.payload;
      Object.entries(updates).forEach(([annId, channels]) => {
        const annotation = state.annotations.entities[annId];
        if (!annotation.measurements?.channels) return;
        Object.entries(channels).forEach(([channelId, measurements]) => {
          Object.assign(
            annotation.measurements!.channels[+channelId],
            measurements as Partial<ChannelMeasurements>,
          );
        });
      });
    },

    // ============== TRACKLET OPERATIONS ==============
    // -- Create
    addTracklet: (state, action: PayloadAction<Tracklet>) => {
      addTrackletCascade(state, action.payload);
    },
    // -- Update
    updateTrackletColor: (
      state,
      action: PayloadAction<{
        id: string;
        color: string;
      }>,
    ) => {
      const { id, color } = action.payload;
      trackletAdapter.updateOne(state.tracklets, { id, changes: { color } });
    },
    addAnnotationToTracklet: (
      state,
      action: PayloadAction<{ trackId: string; annId: string }>,
    ) => {
      addAnnotationToTrackletCascade(
        state,
        action.payload.trackId,
        action.payload.annId,
      );
    },
    removeAnnotationFromTracklet: (
      state,
      action: PayloadAction<{ trackId: string; annId: string }>,
    ) => {
      removeAnnotationFromTrackletCascade(
        state,
        action.payload.trackId,
        action.payload.annId,
      );
    },
    createTrackletRelationship: (
      state,
      action: PayloadAction<{ trackletId1: string; trackletId2: string }>,
    ) => {
      const { trackletId1, trackletId2 } = action.payload;
      const tracklet1 = state.tracklets.entities[trackletId1];
      const tracklet2 = state.tracklets.entities[trackletId2];
      if (tracklet1.end < tracklet2.start)
        addTrackletRelationship(state, trackletId1, trackletId2);
      if (tracklet2.end < tracklet1.start)
        addTrackletRelationship(state, trackletId2, trackletId1);
    },
    removeTrackletRelationship: (
      state,
      action: PayloadAction<{ trackletId1: string; trackletId2: string }>,
    ) => {
      const { trackletId1, trackletId2 } = action.payload;
      const tracklet1 = state.tracklets.entities[trackletId1];
      const tracklet2 = state.tracklets.entities[trackletId2];
      if (tracklet1.end < tracklet2.start)
        removeTrackletRelationship(state, trackletId1, trackletId2);
      if (tracklet2.end < tracklet1.start)
        removeTrackletRelationship(state, trackletId2, trackletId1);
    },

    addChildrenToTracklet: (
      state,
      action: PayloadAction<{ parentId: string; childIds: string[] | string }>,
    ) => {
      const { parentId, childIds } = action.payload;
      const childIdArr = Array.isArray(childIds) ? childIds : [childIds];
      childIdArr.forEach((childId) =>
        addTrackletRelationship(state, parentId, childId),
      );
    },
    removeChildrenFromTracklet: (
      state,
      action: PayloadAction<{ parentId: string; childIds: string[] | string }>,
    ) => {
      const { parentId, childIds } = action.payload;
      const childIdArr = Array.isArray(childIds) ? childIds : [childIds];
      childIdArr.forEach((childId) =>
        removeTrackletRelationship(state, parentId, childId),
      );
    },
    addParentsToTracklet: (
      state,
      action: PayloadAction<{ childId: string; parentIds: string[] }>,
    ) => {
      const { childId, parentIds } = action.payload;
      parentIds.forEach((parentId) =>
        addTrackletRelationship(state, parentId, childId),
      );
    },
    removeParentsFromTracklet: (
      state,
      action: PayloadAction<{ parentIds: string[]; childId: string }>,
    ) => {
      const { parentIds, childId } = action.payload;
      const parentIdArr = Array.isArray(parentIds) ? parentIds : [parentIds];
      parentIdArr.forEach((parentId) =>
        removeTrackletRelationship(state, parentId, childId),
      );
    },
    joinTracklets: (
      state,
      action: PayloadAction<{
        primaryTracklet: string;
        joinedTracklet: string;
      }>,
    ) => {
      joinTrackletsCascade(
        state,
        action.payload.primaryTracklet,
        action.payload.joinedTracklet,
      );
    },
    severTracklet: (
      state,
      action: PayloadAction<{ id: string; timepoint: number }>,
    ) => {
      severTrackletCascade(state, action.payload.id, action.payload.timepoint);
    },
    // -- Delete
    deleteTracklet: (state, action: PayloadAction<string>) => {
      deleteTrackletCascade(state, action.payload);
    },

    // ============== BATCH OPERATIONS ==============

    // -- Kind -- Create
    batchAddKind: (
      state,
      action: PayloadAction<{ kind: Kind; unknownCategory?: Category }[]>,
    ) => {
      const kindGroups = action.payload;
      kindGroups.forEach((kindGroup) =>
        dataSlice.caseReducers.addKind(state, {
          payload: kindGroup,
          type: "addKind",
        }),
      );
    },
    // -- Category -- Create
    batchAddCategory: (state, action: PayloadAction<Category[]>) => {
      const categories = action.payload;
      categories.forEach((category) =>
        dataSlice.caseReducers.addCategory(state, {
          payload: category,
          type: "addCategory",
        }),
      );
    },
    // -- Category -- Delete
    batchDeleteCategoryCascade: (state, action: PayloadAction<string[]>) => {
      deleteCategoryBatch(state, action.payload);
    },
    batchDeleteCategoriesByKind: (state, action: PayloadAction<string>) => {
      const kindId = action.payload;

      const categoryIds = state.relationships.kindToCategories[kindId].filter(
        (catId) => !isUnknownCategory(catId),
      );
      deleteCategoryBatch(state, categoryIds);
    },
    // -- Metadata -- Create
    batchAddMetadata(
      state,
      action: PayloadAction<
        { metadata: ImageMetadata; images: ImageObject[] }[]
      >,
    ) {
      const metadataGroup = action.payload;
      metadataGroup.forEach((metadata) =>
        dataSlice.caseReducers.addMetadata(state, {
          payload: metadata,
          type: "addMetadata",
        }),
      );
    },
    // -- Image -- Create
    batchAddImageData(state, action: PayloadAction<ImageObject[]>) {
      const images = action.payload;
      images.forEach((image) =>
        dataSlice.caseReducers.addImageData(state, {
          payload: image,
          type: "addImageData",
        }),
      );
    },
    // -- Image -- Update
    batchUpdateImageData: (
      state,
      action: PayloadAction<
        {
          id: string;
          changes: Partial<
            Pick<ImageObject, "partition" | "categoryId" | "colors">
          >;
        }[]
      >,
    ) => {
      updateImageDataBatch(state, action.payload);
    },

    batchUpdateImageComputedMeasurements: (
      state,
      action: PayloadAction<
        { imageId: string; measurements: ComputedImageMeasurements }[]
      >,
    ) => {
      action.payload.forEach((computedMeasurement) => {
        dataSlice.caseReducers.updateImageComputedMeasurements(state, {
          type: "updateComputedImageMeasurements",
          payload: computedMeasurement,
        });
      });
    },
    batchUpdateImageChannelMeasurements: (
      state,
      action: PayloadAction<
        {
          id: string;
          channelMeasurements: ChannelData[];
        }[]
      >,
    ) => {
      const batchUpdates = action.payload;

      // Build update objects for entity adapter
      const adapterUpdates = batchUpdates
        .map(({ id, channelMeasurements }) => {
          const image = state.images.entities[id];
          if (!image) return null;

          let updatedMeasurements: ChannelStatistics;

          if (!image.measurements || image.measurements.channels.length === 0) {
            // Create new measurements object
            updatedMeasurements = { channels: channelMeasurements };
          } else {
            // Merge with existing channels
            const existingChannels = [...image.measurements.channels];
            channelMeasurements.forEach((incoming) => {
              const channelIndex = existingChannels.findIndex(
                (existing) => existing.channelId === incoming.channelId,
              );
              if (channelIndex === -1) {
                existingChannels.push(incoming);
              } else {
                existingChannels[channelIndex] = {
                  ...existingChannels[channelIndex],
                  ...incoming,
                };
              }
            });
            updatedMeasurements = { channels: existingChannels };
          }

          return {
            id,
            changes: { measurements: updatedMeasurements },
          };
        })
        .filter(
          (
            update,
          ): update is {
            id: string;
            changes: { measurements: ChannelStatistics };
          } => update !== null,
        );

      // Use entity adapter to properly update
      imageDataAdapter.updateMany(state.images, adapterUpdates);
    },
    // -- Image -- Delete

    batchDeleteImageData(state, action: PayloadAction<string[]>) {
      deleteImageDataBatch(state, action.payload);
    },
    deleteImageDataByCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const imageDataIds =
        state.relationships.categoryToAnnotations[categoryId];
      deleteImageDataBatch(state, imageDataIds);
    },
    // -- Annotation -- Create
    batchAddAnnotations: (state, action: PayloadAction<AnnotationObject[]>) => {
      addAnnotationBatch(state, action.payload);
    },
    // -- Annotation -- Update
    batchUpdateAnnotations(
      state,
      action: PayloadAction<
        {
          id: string;
          changes: Partial<
            Omit<
              AnnotationObject,
              "id" | "bitDepth" | "plane" | "imageId" | "timepoint"
            >
          >;
        }[]
      >,
    ) {
      updateAnnotationBatch(state, action.payload);
    },
    batchUpdateAnnotationChannelMeasurements: (
      state,
      action: PayloadAction<
        {
          id: string;
          channelMeasurements: ChannelData[];
        }[]
      >,
    ) => {
      const batchUpdates = action.payload;

      // Build update objects for entity adapter
      const adapterUpdates = batchUpdates
        .map(({ id, channelMeasurements }) => {
          const annotation = state.annotations.entities[id];
          if (!annotation) return null;

          let updatedMeasurements: ChannelStatistics;

          if (
            !annotation.measurements ||
            annotation.measurements.channels.length === 0
          ) {
            // Create new measurements object
            updatedMeasurements = { channels: channelMeasurements };
          } else {
            // Merge with existing channels
            const existingChannels = [...annotation.measurements.channels];
            channelMeasurements.forEach((incoming) => {
              const channelIndex = existingChannels.findIndex(
                (existing) => existing.channelId === incoming.channelId,
              );
              if (channelIndex === -1) {
                existingChannels.push(incoming);
              } else {
                existingChannels[channelIndex] = {
                  ...existingChannels[channelIndex],
                  ...incoming,
                };
              }
            });
            updatedMeasurements = { channels: existingChannels };
          }

          return {
            id,
            changes: { measurements: updatedMeasurements },
          };
        })
        .filter(
          (
            update,
          ): update is {
            id: string;
            changes: { measurements: ChannelStatistics };
          } => update !== null,
        );

      // Use entity adapter to properly update
      annotationsAdapter.updateMany(state.annotations, adapterUpdates);
    },
    // -- Annotation -- Delete
    batchDeleteAnnotations: (state, action: PayloadAction<string[]>) => {
      const annotationIds = action.payload;

      deleteAnnotationBatch(state, annotationIds);
    },
    deleteAnnotationsOfCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const annotationIds =
        state.relationships.categoryToAnnotations[categoryId];
      deleteAnnotationBatch(state, annotationIds);
    },
    deleteAnnotationsOfKind: (state, action: PayloadAction<string>) => {
      const kindId = action.payload;
      const annotationIds = state.relationships.kindToAnnotations[kindId];
      deleteAnnotationBatch(state, annotationIds);
    },
    // -- Annotation -- Measurements
    batchUpdateAnnotationMeasurements: (
      state,
      action: PayloadAction<
        { annId: string; measurements: ObjectMeasurements }[]
      >,
    ) => {
      action.payload.forEach((annMeasurements) => {
        dataSlice.caseReducers.updateAnnotationMeasurements(state, {
          type: "updateAnnotationMeasurements",
          payload: annMeasurements,
        });
      });
    },
    // -- Tracklet -- Create
    batchAddTracklet: (state, action: PayloadAction<Tracklet[]>) => {
      action.payload.forEach((tracklet) =>
        dataSlice.caseReducers.addTracklet(state, {
          type: "addTracklet",
          payload: tracklet,
        }),
      );
    },
    // -- Tracklet -- Update
    batchAddAnnotationToTracklet: (
      state,
      action: PayloadAction<{ trackId: string; annIds: string[] }[]>,
    ) => {
      const tracks = action.payload;

      tracks.forEach((track) => {
        track.annIds.forEach((annId) => {
          dataSlice.caseReducers.addAnnotationToTracklet(state, {
            type: "addAnnotationToTrackletRecord",
            payload: { trackId: track.trackId, annId },
          });
        });
      });
    },
    batchRemoveAnnotationFromTracklet: (
      state,
      action: PayloadAction<{ trackId: string; annIds: string[] }[]>,
    ) => {
      const tracks = action.payload;

      tracks.forEach((track) => {
        track.annIds.forEach((annId) => {
          dataSlice.caseReducers.removeAnnotationFromTracklet(state, {
            type: "removeAnnotationFromTrackletRecord",
            payload: { trackId: track.trackId, annId },
          });
        });
      });
    },
    // -- Tracklet -- Delete
    batchDeleteTracklet: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((trackletId) => {
        dataSlice.caseReducers.deleteTracklet(state, {
          type: "deleteTracklet",
          payload: trackletId,
        });
      });
    },

    // ============== UTILITY OPERATIONS ==============
    clearAll: () => {
      return initialState;
    },
    initializeLoadedState: (state, action: PayloadAction<DataState>) => {
      const loadedState = action.payload;
      Object.values(state.images.entities).forEach((image) =>
        image.data.dispose(),
      );
      Object.values(state.annotations.entities).forEach((annotation) =>
        annotation.data.dispose(),
      );
      return loadedState;
    },
  },
});
