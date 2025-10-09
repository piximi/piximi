import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  AnnotationObject,
  Category,
  Tracklet,
  ImageMetadata,
  ImageData,
  Kind,
} from "./types";
import { DataState } from "store/types";
import { mutatingFilter } from "utils/arrayUtils";
import { generateCategory, generateUUID, isUnknownCategory } from "./utils";
import { difference } from "lodash";
import {
  IMAGE_KIND,
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "./constants";
import {
  addToSimpleRelationship,
  excludes,
  removeFromSimpleRelationship,
} from "utils/objectUtils";
import { getRandomColor } from "utils/colorUtils";

// Entity Adapters
export const metadataAdapter = createEntityAdapter<ImageMetadata>();
export const imageDataAdapter = createEntityAdapter<ImageData>();
export const kindsAdapter = createEntityAdapter<Kind>();
export const categoriesAdapter = createEntityAdapter<Category>();
export const annotationsAdapter = createEntityAdapter<AnnotationObject>();

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
  relationships: {
    kindToCategories: { [imageKind.id]: [unknownImageCategory.id] },
    kindToAnnotations: {},
    categoryToImages: { [unknownImageCategory.id]: [] },
    categoryToAnnotations: {},
    imageToAnnotations: {},
    metadataToTracklets: {},
  },
  tracklets: {},
};

export const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    // ============== KIND OPERATIONS ==============
    addKind: (
      state,
      action: PayloadAction<{ kind: Kind; unknownCategory?: Category }>,
    ) => {
      const kind = action.payload.kind;
      // Prevent overwriting IMAGE_KIND
      if (kind.id === IMAGE_KIND && state.kinds.entities[IMAGE_KIND]) {
        console.error("Cannot recreate IMAGE_KIND - it already exists");
        return;
      }
      let unknownCategory = action.payload.unknownCategory;
      // Validation

      // ensure unknown category is given if specified in kind
      if (kind.unknownCategoryId && !unknownCategory) {
        console.error("Unknown category specified in kind but not provided");
        return;
      }
      if (unknownCategory) {
        // ensure correct identifiers between kind and unknown category
        if (
          kind.unknownCategoryId !== unknownCategory.id ||
          unknownCategory.kind !== kind.id
        ) {
          console.error("Mismatch between kind and unknown category");
          return;
        }
      }

      // if no unknown category provided, create one
      if (!unknownCategory) {
        unknownCategory = generateCategory(
          UNKNOWN_CATEGORY_NAME,
          kind.id,
          UNKNOWN_ANNOTATION_CATEGORY_COLOR,
        );
        unknownCategory.id = kind.unknownCategoryId;
      }
      kindsAdapter.addOne(state.kinds, kind);

      // Initialize relationship entries
      state.relationships.kindToCategories[action.payload.kind.id] = [
        unknownCategory.id,
      ];
      state.relationships.kindToAnnotations[action.payload.kind.id] = [];

      // Add unknown category
      categoriesAdapter.addOne(state.categories, unknownCategory);

      // Initialize relationship entries
      state.relationships.categoryToImages[unknownCategory.id] = [];
      state.relationships.categoryToAnnotations[unknownCategory.id] = [];
    },

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

    deleteKind: (state, action: PayloadAction<string>) => {
      const kindId = action.payload;

      // Delete the kind
      kindsAdapter.removeOne(state.kinds, kindId);

      // Clean up relationships
      delete state.relationships.kindToCategories[kindId];
      delete state.relationships.kindToAnnotations[kindId];
    },

    deleteKindCascade: (state, action: PayloadAction<string>) => {
      const kindId = action.payload;
      if (kindId === "Images") return;

      // Delete all related categories
      const categoryIds = state.relationships.kindToCategories[kindId] || [];
      categoriesAdapter.removeMany(state.categories, categoryIds);

      // Clean up category relationships
      categoryIds.forEach((catId) => {
        delete state.relationships.categoryToAnnotations[catId];
      });

      const annotationIds = state.relationships.kindToAnnotations[kindId];

      annotationIds.forEach((annId) => {
        const { imageId } = state.annotations.entities[annId];

        if (!imageId) return;

        removeFromSimpleRelationship(
          state.relationships.imageToAnnotations,
          imageId,
          annId,
        );
      });
      annotationsAdapter.removeMany(state.annotations, annotationIds);

      // Clean up kind relationships
      delete state.relationships.kindToCategories[kindId];
      delete state.relationships.kindToAnnotations[kindId];

      // Finally, delete the kind
      kindsAdapter.removeOne(state.kinds, kindId);
    },

    // ============== CATEGORY OPERATIONS ==============
    addCategory: (state, action: PayloadAction<Category>) => {
      const category = action.payload;
      if (isUnknownCategory(category.id)) {
        console.error("Cannot directly create unknown category.");
        return;
      }
      categoriesAdapter.addOne(state.categories, category);

      // Initialize relationship entries
      state.relationships.categoryToImages[category.id] = [];
      state.relationships.categoryToAnnotations[category.id] = [];

      // Update kind relationship

      addToSimpleRelationship(
        state.relationships.kindToCategories,
        category.kind,
        category.id,
      );
    },

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

    deleteCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      if (isUnknownCategory(categoryId)) {
        console.error("Cannot remove unknown Category");
        return;
      }
      const category = state.categories.entities[categoryId];

      if (!category) return;

      // Remove from kind relationship
      removeFromSimpleRelationship(
        state.relationships.kindToCategories,
        category.kind,
        categoryId,
      );

      // Clean up relationships
      delete state.relationships.categoryToImages[categoryId];
      delete state.relationships.categoryToAnnotations[categoryId];

      // Delete the category
      categoriesAdapter.removeOne(state.categories, categoryId);
    },

    deleteCategoryCascade: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      if (isUnknownCategory(categoryId)) {
        console.error("Cannot remove unknown Category");
        return;
      }
      const category = state.categories.entities[categoryId];

      if (!category) return;

      // Update all images that use this category to use unknown category
      const kind = state.kinds.entities[category.kind];
      const unknownCategoryId = kind.unknownCategoryId;
      if (kind.id === IMAGE_KIND) {
        const imageIds = state.relationships.categoryToImages[categoryId] || [];
        imageIds.forEach((imageId) => {
          // Update image entity
          imageDataAdapter.updateOne(state.images, {
            id: imageId,
            changes: { categoryId: unknownCategoryId },
          });
          // Update relationships
          removeFromSimpleRelationship(
            state.relationships.categoryToImages,
            categoryId,
            imageId,
          );
          addToSimpleRelationship(
            state.relationships.categoryToImages,
            unknownCategoryId,
            imageId,
          );
        });
        // Clean up relationships
        delete state.relationships.categoryToImages[categoryId];
      } else {
        const annIds =
          state.relationships.categoryToAnnotations[categoryId] || [];
        annIds.forEach((annId) => {
          // Update annotation entity
          annotationsAdapter.updateOne(state.annotations, {
            id: annId,
            changes: { categoryId: unknownCategoryId },
          });
          // Update relationships
          removeFromSimpleRelationship(
            state.relationships.categoryToAnnotations,
            categoryId,
            annId,
          );
          addToSimpleRelationship(
            state.relationships.categoryToAnnotations,
            unknownCategoryId,
            annId,
          );
        });
        // Clean up relationships
        delete state.relationships.categoryToAnnotations[categoryId];
      }

      // Remove from kind relationship
      removeFromSimpleRelationship(
        state.relationships.kindToCategories,
        category.kind,
        categoryId,
      );

      // Delete the category
      categoriesAdapter.removeOne(state.categories, categoryId);
    },

    // ============== METADATA OPERATIONS ==============
    addMetadata: (
      state,
      action: PayloadAction<{ metadata: ImageMetadata; images: ImageData[] }>,
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
    addImageData: (state, action: PayloadAction<ImageData>) => {
      const image = action.payload;
      imageDataAdapter.addOne(state.images, image);

      // Initialize annotation relationship
      state.relationships.imageToAnnotations[image.id] = [];

      // Update category relationships

      addToSimpleRelationship(
        state.relationships.categoryToImages,
        image.categoryId,
        image.id,
      );
    },

    updateImageData: (
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<Omit<ImageData, "data">>;
      }>,
    ) => {
      const { id, changes } = action.payload;
      const existingImageData = state.images.entities[id];

      if (!existingImageData) return;

      // Handle timepoint category changes

      // Remove old category relationships

      if (changes.categoryId) {
        removeFromSimpleRelationship(
          state.relationships.categoryToImages,
          existingImageData.categoryId,
          id,
        );
        addToSimpleRelationship(
          state.relationships.categoryToImages,
          changes.categoryId,
          id,
        );
      }

      imageDataAdapter.updateOne(state.images, { id, changes });
    },

    deleteImageData: (state, action: PayloadAction<string>) => {
      const imageId = action.payload;
      const image = state.images.entities[imageId];

      if (!image) return;

      // Remove from category relationships
      removeFromSimpleRelationship(
        state.relationships.categoryToImages,
        image.categoryId,
        imageId,
      );

      image.data.dispose();

      // Clean up image-annotation relationship
      delete state.relationships.imageToAnnotations[imageId];

      // Delete the image
      imageDataAdapter.removeOne(state.images, imageId);

      // Remove from metadata and delete metadata if no images
      const metadata = state.metadata.entities[image.metadataId];
      mutatingFilter(metadata.imageDataIds, (id) => id !== imageId);
      if (metadata.imageDataIds.length === 0) {
        metadataAdapter.removeOne(state.metadata, metadata.id);
      } else {
        if (metadata.defaultImageId === imageId)
          metadata.defaultImageId = metadata.imageDataIds[0];
      }
    },
    deleteImageCascade: (state, action: PayloadAction<string>) => {
      const imageId = action.payload;
      const image = state.images.entities[imageId];
      if (!image) return;
      // Delete all annotations for this image
      const annotationIds = state.relationships.imageToAnnotations[imageId];
      annotationIds.forEach((annId) => {
        const annotation = state.annotations.entities[annId];
        if (annotation) {
          // Remove from category relationship
          removeFromSimpleRelationship(
            state.relationships.categoryToAnnotations,
            annotation.categoryId,
            annId,
          );
          // Remove from kind relationship
          removeFromSimpleRelationship(
            state.relationships.kindToAnnotations,
            annotation.kind,
            annId,
          );
          // Clean up link graph
          if (annotation.trackId) {
            dataSlice.caseReducers.removeAnnotationFromTrackletRecord(state, {
              payload: { trackId: annotation.trackId, annId },
              type: "removeAnnotationFromTrackletRecord",
            });
          }
          annotation.data.dispose();
        }
      });
      annotationsAdapter.removeMany(state.annotations, annotationIds);

      // Remove from category relationships
      removeFromSimpleRelationship(
        state.relationships.categoryToImages,
        image.categoryId,
        imageId,
      );

      image.data.dispose();

      // Clean up relationships
      delete state.relationships.imageToAnnotations[imageId];

      // Delete the image
      imageDataAdapter.removeOne(state.images, imageId);

      // Remove from metadata and delete metadata if no images
      const metadata = state.metadata.entities[image.metadataId];
      mutatingFilter(metadata.imageDataIds, (id) => id !== imageId);
      if (metadata.imageDataIds.length === 0) {
        metadataAdapter.removeOne(state.metadata, metadata.id);
      } else {
        if (metadata.defaultImageId === imageId)
          metadata.defaultImageId = metadata.imageDataIds[0];
      }
    },

    // ============== ANNOTATION OPERATIONS ==============
    addAnnotation: (state, action: PayloadAction<AnnotationObject>) => {
      const annotation = action.payload;
      annotationsAdapter.addOne(state.annotations, annotation);

      // Update relationships
      if (annotation.imageId) {
        addToSimpleRelationship(
          state.relationships.imageToAnnotations,
          annotation.imageId,
          annotation.id,
        );
      }
      if (annotation.categoryId) {
        addToSimpleRelationship(
          state.relationships.categoryToAnnotations,
          annotation.categoryId,
          annotation.id,
        );
      }
      if (annotation.kind) {
        addToSimpleRelationship(
          state.relationships.kindToAnnotations,
          annotation.kind,
          annotation.id,
        );
      }
    },

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
      const { id, changes } = action.payload;
      const existingAnnotation = state.annotations.entities[id];

      if (!existingAnnotation) return;

      // Handle category change
      if (
        changes.categoryId &&
        changes.categoryId !== existingAnnotation.categoryId
      ) {
        removeFromSimpleRelationship(
          state.relationships.categoryToAnnotations,
          existingAnnotation.categoryId,
          id,
        );
        addToSimpleRelationship(
          state.relationships.categoryToAnnotations,
          changes.categoryId,
          id,
        );
      }

      // Handle kind change
      if (changes.kind && changes.kind !== existingAnnotation.kind) {
        removeFromSimpleRelationship(
          state.relationships.kindToAnnotations,
          existingAnnotation.kind,
          id,
        );

        addToSimpleRelationship(
          state.relationships.kindToAnnotations,
          changes.kind,
          id,
        );
      }

      annotationsAdapter.updateOne(state.annotations, { id, changes });
    },

    deleteAnnotation: (state, action: PayloadAction<string>) => {
      const annotationId = action.payload;
      const annotation = state.annotations.entities[annotationId];

      if (!annotation) return;

      // Remove from relationships
      removeFromSimpleRelationship(
        state.relationships.imageToAnnotations,
        annotation.imageId,
        annotationId,
      );
      removeFromSimpleRelationship(
        state.relationships.categoryToAnnotations,
        annotation.categoryId,
        annotationId,
      );
      removeFromSimpleRelationship(
        state.relationships.kindToAnnotations,
        annotation.kind,
        annotationId,
      );

      // Clean up link graph
      if (annotation.trackId) {
        dataSlice.caseReducers.removeAnnotationFromTrackletRecord(state, {
          payload: { trackId: annotation.trackId, annId: annotation.id },
          type: "removeAnnotationFromTrackletRecord",
        });
      }

      // Delete the annotation
      annotationsAdapter.removeOne(state.annotations, annotationId);
    },

    // ============== GLOBAL ANNOTATION OPERATIONS ==============
    addTracklet: (state, action: PayloadAction<Tracklet>) => {
      const tracklet = action.payload;
      state.tracklets[tracklet.trackId] = tracklet;
      // Initialize array if it doesn't exist
      if (!state.relationships.metadataToTracklets[tracklet.metadataId]) {
        state.relationships.metadataToTracklets[tracklet.metadataId] = [];
      }
      state.relationships.metadataToTracklets[tracklet.metadataId].push(
        tracklet.trackId,
      );

      // Update all linked annotations with trackId
      if (tracklet.linkedIds && tracklet.linkedIds.length > 0) {
        annotationsAdapter.updateMany(
          state.annotations,
          tracklet.linkedIds.map((annId) => ({
            id: annId,
            changes: { trackId: tracklet.trackId },
          })),
        );
      }
    },

    deleteTracklet: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      const tracklet = state.tracklets[trackId];
      const trackletMetadataId = tracklet.metadataId;
      const linkedAnnotations = tracklet.linkedIds;
      const children = tracklet.children;
      const parents = tracklet.parents;

      annotationsAdapter.updateMany(
        state.annotations,
        linkedAnnotations.map((annId) => ({
          id: annId,
          changes: { trackId: undefined },
        })),
      );
      if (children)
        children.forEach((childId) =>
          mutatingFilter(
            state.tracklets[childId].parents!,
            (id) => id !== trackId,
          ),
        );

      if (parents)
        parents.forEach((parentId) =>
          mutatingFilter(
            state.tracklets[parentId].children!,
            (id) => id !== trackId,
          ),
        );

      delete state.tracklets[trackId];
      removeFromSimpleRelationship(
        state.relationships.metadataToTracklets,
        trackletMetadataId,
        trackId,
      );
    },
    updateTracklet: (
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<Pick<Tracklet, "color">>;
      }>,
    ) => {
      const { id, changes } = action.payload;
      Object.assign(state.tracklets[id], changes);
    },
    addAnnotationToTrackletRecord: (
      state,
      action: PayloadAction<{ trackId: string; annId: string }>,
    ) => {
      const { trackId, annId } = action.payload;
      const annotation = state.annotations.entities[annId];
      if (!(trackId in state.tracklets)) {
        const metadataId = state.images.entities[annotation.imageId].metadataId;
        state.tracklets[trackId] = {
          metadataId,
          trackId: trackId,
          start: annotation.timepoint,
          end: annotation.timepoint,
          color: getRandomColor(),
          linkedIds: [annId],
        };
        state.relationships.metadataToTracklets[metadataId].push(trackId);
        return;
      }
      const tracklet = state.tracklets[trackId];

      if (!tracklet.linkedIds.includes(annId)) {
        tracklet.linkedIds.push(annId);
        if (
          tracklet.start === undefined ||
          tracklet.start > annotation.timepoint
        )
          tracklet.start = annotation.timepoint;
        if (tracklet.end === undefined || tracklet.end < annotation.timepoint)
          tracklet.end = annotation.timepoint;
      }
    },
    batchAddAnnotationToTracklet: (
      state,
      action: PayloadAction<{ trackId: string; annIds: string[] }[]>,
    ) => {
      const tracks = action.payload;

      tracks.forEach((track) => {
        track.annIds.forEach((annId) => {
          dataSlice.caseReducers.addAnnotationToTrackletRecord(state, {
            type: "addAnnotationToTrackletRecord",
            payload: { trackId: track.trackId, annId },
          });
        });
      });
    },
    removeAnnotationFromTrackletRecord: (
      state,
      action: PayloadAction<{ trackId: string; annId: string }>,
    ) => {
      const { trackId, annId } = action.payload;
      if (trackId in state.tracklets) {
        const tracklet = state.tracklets[trackId];
        const removedTP = state.annotations.entities[annId].timepoint;
        if (tracklet.start === removedTP) {
          let candidate: number | null = null;
          for (const id of tracklet.linkedIds) {
            const tp = state.annotations.entities[id].timepoint;
            if (tp > removedTP && (candidate === null || tp < candidate)) {
              candidate = tp;
            }
          }
          tracklet.start = candidate ? candidate : undefined;
        }
        if (tracklet.end === removedTP) {
          let candidate: number | null = null;
          for (const id of tracklet.linkedIds) {
            const tp = state.annotations.entities[id].timepoint;
            if (tp < removedTP && (candidate === null || tp > candidate)) {
              candidate = tp;
            }
          }
          tracklet.end = candidate ? candidate : undefined;
        }
        mutatingFilter(
          state.tracklets[trackId].linkedIds,
          (id) => id !== annId,
        );
      }
    },

    toggleAnnotationInTrackletRecord: (
      state,
      action: PayloadAction<{ trackId: string; annId: string }>,
    ) => {
      const { trackId, annId } = action.payload;
      if (excludes(state.tracklets, trackId)) {
        dataSlice.caseReducers.addAnnotationToTrackletRecord(state, {
          type: "addAnnotationToTrackletRecord",
          payload: action.payload,
        });
        return;
      }
      const idExists = state.tracklets[trackId].linkedIds.includes(annId);
      if (idExists) {
        dataSlice.caseReducers.removeAnnotationFromTrackletRecord(state, {
          type: "removeAnnotationFromTrackletRecord",
          payload: action.payload,
        });
      } else {
        dataSlice.caseReducers.addAnnotationToTrackletRecord(state, {
          type: "addAnnotationToTrackletRecord",
          payload: action.payload,
        });
      }
    },
    addChildToTrack: (
      state,
      action: PayloadAction<{ parentId: string; childId: string }>,
    ) => {
      const { parentId, childId } = action.payload;
      const parentTracklet = state.tracklets[parentId];
      const childTracklet = state.tracklets[childId];
      parentTracklet.children
        ? parentTracklet.children.push(childId)
        : (parentTracklet.children = [childId]);
      childTracklet.parents
        ? childTracklet.parents.push(parentId)
        : (childTracklet.parents = [parentId]);
    },

    addChildrenToTrack: (
      state,
      action: PayloadAction<{ parentId: string; childIds: string[] }>,
    ) => {
      const { parentId, childIds } = action.payload;
      const parentTracklet = state.tracklets[parentId];
      parentTracklet.children
        ? parentTracklet.children.push(...childIds)
        : (parentTracklet.children = childIds);

      childIds.forEach((id) => {
        const childTracklet = state.tracklets[id];
        childTracklet.parents
          ? childTracklet.parents.push(parentId)
          : (childTracklet.parents = [parentId]);
      });
    },
    removeChildFromTrack: (
      state,
      action: PayloadAction<{ parentId: string; childId: string }>,
    ) => {
      const { parentId, childId } = action.payload;
      const parentTracklet = state.tracklets[parentId];
      const childTracklet = state.tracklets[childId];
      parentTracklet.children &&
        mutatingFilter(parentTracklet.children, (id) => id !== childId);
      childTracklet.parents &&
        mutatingFilter(childTracklet.parents, (id) => id !== parentId);
    },

    removeChildrenFromTrack: (
      state,
      action: PayloadAction<{ parentId: string; childIds: string[] }>,
    ) => {
      const { parentId, childIds } = action.payload;
      const parentTracklet = state.tracklets[parentId];
      parentTracklet.children &&
        mutatingFilter(parentTracklet.children, (id) => !childIds.includes(id));

      childIds.forEach((id) => {
        const childTracklet = state.tracklets[id];
        childTracklet.parents &&
          mutatingFilter(childTracklet.parents, (id) => id !== parentId);
      });
    },

    addParentsToTrack: (
      state,
      action: PayloadAction<{ childId: string; parentIds: string[] }>,
    ) => {
      const { childId, parentIds } = action.payload;
      const childTracklet = state.tracklets[childId];
      childTracklet.parents
        ? childTracklet.parents.push(...parentIds)
        : (childTracklet.parents = parentIds);

      parentIds.forEach((id) => {
        const parentTracklet = state.tracklets[id];
        parentTracklet.children
          ? parentTracklet.children.push(childId)
          : (parentTracklet.children = [childId]);
      });
    },

    removeParentsFromTrack: (
      state,
      action: PayloadAction<{ parentIds: string[]; childId: string }>,
    ) => {
      const { parentIds, childId } = action.payload;
      const childTracklet = state.tracklets[childId];
      childTracklet.parents &&
        mutatingFilter(childTracklet.parents, (id) => !parentIds.includes(id));

      parentIds.forEach((id) => {
        const parentTracklet = state.tracklets[id];
        parentTracklet.children &&
          mutatingFilter(parentTracklet.children, (id) => id !== childId);
      });
    },

    // ============== BATCH OPERATIONS ==============
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
    batchAddCategory: (state, action: PayloadAction<Category[]>) => {
      const categories = action.payload;
      categories.forEach((category) =>
        dataSlice.caseReducers.addCategory(state, {
          payload: category,
          type: "addCategory",
        }),
      );
    },
    batchDeleteCategoryCascade: (state, action: PayloadAction<string[]>) => {
      const categoryIds = action.payload;
      categoryIds.forEach((id) =>
        dataSlice.caseReducers.deleteCategoryCascade(state, {
          payload: id,
          type: "deleteCategoryCascade",
        }),
      );
    },
    batchDeleteCategoriesByKind: (state, action: PayloadAction<string>) => {
      const kindId = action.payload;

      const categories = state.relationships.kindToCategories[kindId].filter(
        (catId) => !isUnknownCategory(catId),
      );

      dataSlice.caseReducers.batchDeleteCategoryCascade(state, {
        payload: categories,
        type: "batchDeleteCategoryCascade",
      });
    },
    batchAddMetadata(
      state,
      action: PayloadAction<{ metadata: ImageMetadata; images: ImageData[] }[]>,
    ) {
      const metadataGroup = action.payload;
      metadataGroup.forEach((metadata) =>
        dataSlice.caseReducers.addMetadata(state, {
          payload: metadata,
          type: "addMetadata",
        }),
      );
    },
    batchAddImageData(state, action: PayloadAction<ImageData[]>) {
      const images = action.payload;
      images.forEach((image) =>
        dataSlice.caseReducers.addImageData(state, {
          payload: image,
          type: "addImageData",
        }),
      );
    },
    batchUpdateImageData: (
      state,
      action: PayloadAction<
        {
          id: string;
          changes: Partial<
            Pick<ImageData, "partition" | "categoryId" | "colors">
          >;
        }[]
      >,
    ) => {
      const updates = action.payload;
      updates.forEach((update) =>
        dataSlice.caseReducers.updateImageData(state, {
          payload: update,
          type: "updateImageData",
        }),
      );
    },
    batchDeleteImageData(state, action: PayloadAction<string[]>) {
      const imageIds = action.payload;
      imageIds.forEach((id) => {
        dataSlice.caseReducers.deleteImageData(state, {
          payload: id,
          type: "deleteImage",
        });
      });
    },
    batchDeleteImageDataCascade(state, action: PayloadAction<string[]>) {
      const imageIds = action.payload;
      imageIds.forEach((id) => {
        dataSlice.caseReducers.deleteImageCascade(state, {
          payload: id,
          type: "deleteImageCascade",
        });
      });
    },
    deleteImageDataByCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const imageDataIds =
        state.relationships.categoryToAnnotations[categoryId];
      dataSlice.caseReducers.batchDeleteImageDataCascade(state, {
        payload: imageDataIds,
        type: "batchDeleteImageDataCascade",
      });
    },
    batchAddAnnotations: (state, action: PayloadAction<AnnotationObject[]>) => {
      const annotations = action.payload;

      annotationsAdapter.addMany(state.annotations, annotations);

      annotations.forEach((annotation) => {
        if (annotation.imageId) {
          addToSimpleRelationship(
            state.relationships.imageToAnnotations,
            annotation.imageId,
            annotation.id,
          );
        }
        if (annotation.categoryId) {
          addToSimpleRelationship(
            state.relationships.categoryToAnnotations,
            annotation.categoryId,
            annotation.id,
          );
        }
        if (annotation.kind) {
          addToSimpleRelationship(
            state.relationships.kindToAnnotations,
            annotation.kind,
            annotation.id,
          );
        }
      });
    },
    batchUpdateAnnotation(
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
      const annotationUpdates = action.payload;
      annotationUpdates.forEach((update) =>
        dataSlice.caseReducers.updateAnnotation(state, {
          payload: update,
          type: "updateAnnotation",
        }),
      );
    },
    batchDeleteAnnotations: (state, action: PayloadAction<string[]>) => {
      const annotationIds = action.payload;

      annotationIds.forEach((annotationId) => {
        const annotation = state.annotations.entities[annotationId];
        if (annotation) {
          removeFromSimpleRelationship(
            state.relationships.imageToAnnotations,
            annotation.imageId,
            annotationId,
          );
          removeFromSimpleRelationship(
            state.relationships.categoryToAnnotations,
            annotation.categoryId,
            annotationId,
          );
          removeFromSimpleRelationship(
            state.relationships.kindToAnnotations,
            annotation.kind,
            annotationId,
          );

          // Clean up link graph
          if (annotation.trackId) {
            dataSlice.caseReducers.removeAnnotationFromTrackletRecord(state, {
              payload: { trackId: annotation.trackId, annId: annotation.id },
              type: "removeAnnotationFromTrackletRecord",
            });
          }
        }
      });

      annotationsAdapter.removeMany(state.annotations, annotationIds);
    },
    deleteAnnotationsOfCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const annotationIds =
        state.relationships.categoryToAnnotations[categoryId];
      dataSlice.caseReducers.batchDeleteAnnotations(state, {
        payload: annotationIds,
        type: "batchDeleteAnotations",
      });
    },
    deleteAnnotationsOfKind: (state, action: PayloadAction<string>) => {
      const kindId = action.payload;
      const annotationIds = state.relationships.kindToAnnotations[kindId];
      dataSlice.caseReducers.batchDeleteAnnotations(state, {
        payload: annotationIds,
        type: "batchDeleteAnotations",
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
