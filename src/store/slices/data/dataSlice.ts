import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import { createDeferredEntityAdapter } from "store/entities/create_deferred_adapter";

import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";

import {
  ImageType,
  Partition,
  DecodedAnnotationType,
  AnnotationType,
  Data,
  PartialBy,
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_IMAGE_CATEGORY,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "types";
import { ImageShapeInfo, replaceDuplicateName } from "utils/common/image";
import { mutatingFilter } from "utils/common/helpers";
import { dispose, TensorContainer } from "@tensorflow/tfjs";
import { encode } from "utils/annotator";

export const imageCategoriesAdapter = createDeferredEntityAdapter<Category>();
export const annotationCategoriesAdapter =
  createDeferredEntityAdapter<Category>();

export const imagesAdapter = createDeferredEntityAdapter<ImageType>();
export const annotationsAdapter = createDeferredEntityAdapter<AnnotationType>();

export const initialState = (): Data => {
  return {
    imageCategories: imageCategoriesAdapter.getInitialState({
      ids: [UNKNOWN_IMAGE_CATEGORY_ID],
      entities: {
        [UNKNOWN_IMAGE_CATEGORY_ID]: {
          saved: UNKNOWN_IMAGE_CATEGORY,
          changes: {},
        },
      },
    }),

    annotationCategories: annotationCategoriesAdapter.getInitialState({
      ids: [UNKNOWN_ANNOTATION_CATEGORY_ID],
      entities: {
        [UNKNOWN_ANNOTATION_CATEGORY_ID]: {
          saved: UNKNOWN_ANNOTATION_CATEGORY,
          changes: {},
        },
      },
    }),
    images: imagesAdapter.getInitialState(),
    annotations: annotationsAdapter.getInitialState(),
    annotationsByImage: {},
    annotationsByCategory: { [UNKNOWN_ANNOTATION_CATEGORY_ID]: [] },
    imagesByCategory: { [UNKNOWN_IMAGE_CATEGORY_ID]: [] },
  };
};

// TODO: Allow each data type to be added individually, i.e. images without image categories, annotations without images.

// NOTE-#1: Case reducers dont fire listeners

export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    resetData: (state) => initialState(),
    initData(
      state,
      action: PayloadAction<{
        images: Array<ImageType>;
        annotations: Array<AnnotationType>;
        categories: Array<Category>;
        annotationCategories: Array<Category>;
      }>
    ) {
      const {
        images: newImages,
        annotations: newAnnotations,
        categories: newCategories,
        annotationCategories: newAnnotationCategories,
      } = action.payload;
      dataSlice.caseReducers.addImageCategories(state, {
        type: "addImageCategories",
        payload: { categories: newCategories, isPermanent: true },
      });

      dataSlice.caseReducers.addAnnotationCategories(state, {
        type: "addAnnotationCategories",
        payload: {
          categories: newAnnotationCategories,
          isPermanent: true,
        },
      });

      dataSlice.caseReducers.addImages(state, {
        type: "addImages",
        payload: { images: newImages, isPermanent: true },
      });

      dataSlice.caseReducers.addAnnotations(state, {
        type: "addAnnotations",
        payload: { annotations: newAnnotations, isPermanent: true },
      });
    },
    addImageCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;
      for (const category of categories) {
        if (state.imageCategories.ids.includes(category.id)) continue;
        state.imagesByCategory[category.id] = [];

        imageCategoriesAdapter.addOne(state.imageCategories, category);
        if (isPermanent) {
          state.imageCategories.entities[category.id].changes = {};
        }
      }
    },
    createImageCategory(
      state,
      action: PayloadAction<{
        name: string;
        color: string;
        isPermanent?: boolean;
      }>
    ) {
      const { name, color, isPermanent } = action.payload;
      let id = uuidv4();
      let idIsUnique = !state.imageCategories.ids.includes(id);

      while (!idIsUnique) {
        id = uuidv4();
        idIsUnique = !state.imageCategories.ids.includes(id);
      }

      state.imagesByCategory[id] = [];

      imageCategoriesAdapter.addOne(state.imageCategories, {
        id: id,
        name: name,
        color: color,
        visible: true,
      } as Category);
      if (isPermanent) {
        state.imageCategories.entities[id].changes = {};
      }
    },
    updateImageCategory(
      state,
      action: PayloadAction<{
        updates: PartialBy<Category, "color" | "name" | "visible">;
        isPermanent?: boolean;
      }>
    ) {
      const { updates, isPermanent } = action.payload;
      const id = updates.id;

      if (isPermanent) {
        state.imageCategories.entities[id] = {
          ...state.imageCategories.entities[id],
          ...updates,
        };
      }
      imageCategoriesAdapter.updateOne(state.imageCategories, {
        id: id,
        changes: updates,
      });
    },
    setOtherImageCategoriesInvisible(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      const { id } = action.payload;
      const idsToUpdate = state.imageCategories.ids.filter((_id) => {
        return (
          _id !== id &&
          state.imageCategories.entities[_id].saved.visible !== false &&
          state.imageCategories.entities[_id].changes?.visible !== false
        );
      });
      const changes = idsToUpdate.map((_id) => {
        return { id: _id, changes: { visible: false } };
      });
      imageCategoriesAdapter.updateMany(state.imageCategories, changes);
    },
    setImageCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;

      dataSlice.caseReducers.deleteAllImageCategories(state, {
        type: "deleteAllImageCategories",
        payload: {},
      });
      dataSlice.caseReducers.addImageCategories(state, {
        type: "addImageCategories",
        payload: {
          categories: categories,
          isPermanent: isPermanent,
        },
      });
    },
    upsertImageCategory(
      state,
      action: PayloadAction<{
        category: PartialBy<Category, "id" | "visible">;
        isPermanent?: boolean;
      }>
    ) {
      const { category, isPermanent } = action.payload;

      if (!category.id) {
        dataSlice.caseReducers.createImageCategory(state, {
          type: "createImageCategory",
          payload: {
            name: category.name!,
            color: category.color!,
            isPermanent: isPermanent,
          },
        });
      } else {
        dataSlice.caseReducers.updateImageCategory(state, {
          type: "updateImageCategory",
          payload: {
            updates: category as PartialBy<
              Category,
              "color" | "name" | "visible"
            >,
            isPermanent: isPermanent,
          },
        });
      }
    },

    deleteImageCategories(
      state,
      action: PayloadAction<{ categoryIds: string[]; isPermanent?: boolean }>
    ) {
      const { categoryIds, isPermanent } = action.payload;
      for (const categoryId of categoryIds) {
        const imageIds = state.imagesByCategory[categoryId];
        state.imagesByCategory[UNKNOWN_IMAGE_CATEGORY_ID].push(
          ...state.imagesByCategory[categoryId]
        );

        // ----

        dataSlice.caseReducers.updateImages(state, {
          type: "updateImages",
          payload: {
            updates: imageIds.map((imageId) => ({
              id: imageId,
              categoryId: UNKNOWN_IMAGE_CATEGORY_ID,
            })),
            isPermanent: isPermanent,
          },
        });
        delete state.imagesByCategory[categoryId];

        if (isPermanent) {
          delete state.imageCategories.entities[categoryId];
          mutatingFilter(
            state.imageCategories.ids,
            (catId) => catId !== categoryId
          );
        } else {
          imageCategoriesAdapter.removeOne(state.imageCategories, categoryId);
        }
      }
    },
    deleteAllImageCategories(
      state,
      action: PayloadAction<{ isPermanent?: boolean }>
    ) {
      const { isPermanent } = action.payload;
      // Must create new ids array, otherwise the array will change as deletions occur
      const categories = [...state.imageCategories.ids];

      dataSlice.caseReducers.deleteImageCategories(state, {
        type: "deleteImageCategory",
        payload: {
          categoryIds: categories as string[],
          isPermanent: isPermanent,
        },
      });
    },
    createAnnotationCategory(
      state,
      action: PayloadAction<{
        name: string;
        color: string;
        id?: string;
        isPermanent?: boolean;
      }>
    ) {
      const { name, color, isPermanent } = action.payload;
      let id = uuidv4();
      let idIsUnique = !state.annotationCategories.ids.includes(id);

      while (!idIsUnique) {
        id = uuidv4();
        idIsUnique = !state.annotationCategories.ids.includes(id);
      }
      state.annotationsByCategory[id] = [];

      const newCategory = {
        id: id,
        name: name,
        color: color,
        visible: true,
      } as Category;
      annotationCategoriesAdapter.addOne(
        state.annotationCategories,
        newCategory
      );

      if (isPermanent) {
        state.annotationCategories.entities[id].changes = {};
      }
    },
    addAnnotationCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;
      for (const category of categories) {
        state.annotationsByCategory[category.id] = [];
        annotationCategoriesAdapter.addOne(
          state.annotationCategories,
          category
        );
        if (isPermanent) {
          state.annotationCategories.entities[category.id].changes = {};
        }
      }
    },
    updateAnnotationCategory(
      state,
      action: PayloadAction<{
        updates: PartialBy<Category, "color" | "name" | "visible">;
        isPermanent?: boolean;
      }>
    ) {
      const { updates, isPermanent } = action.payload;
      const id = updates.id;
      if (isPermanent) {
        state.annotationCategories.entities[id].saved = {
          ...state.annotationCategories.entities[id].saved,
          ...updates,
        };
      } else {
        annotationCategoriesAdapter.updateOne(state.annotationCategories, {
          id: id,
          changes: updates,
        });
      }
    },
    setAnnotationCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;
      for (const categoryId in state.annotationsByCategory) {
        if (categoryId !== UNKNOWN_ANNOTATION_CATEGORY_ID) {
          state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
            ...state.annotationsByCategory[categoryId]
          );
          delete state.annotationsByCategory[categoryId];
        }
      }
      for (const annotationId of state.annotations.ids) {
        annotationsAdapter.updateOne(state.annotations, {
          id: annotationId,
          changes: { categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID },
        });
      }
      for (const category of categories) {
        state.annotationsByCategory[category.id] = [];
        annotationCategoriesAdapter.setOne(
          state.annotationCategories,
          category
        );
        if (isPermanent) {
          state.annotationCategories.entities[category.id].changes.added =
            false;
        }
      }
    },
    upsertAnnotationCategory(
      state,
      action: PayloadAction<{
        category: PartialBy<Category, "id" | "visible">;
        isPermanent?: boolean;
      }>
    ) {
      const { category, isPermanent } = action.payload;

      if (!category.id) {
        dataSlice.caseReducers.createAnnotationCategory(state, {
          type: "createAnnotationCategory",
          payload: {
            name: category.name!,
            color: category.color!,
            isPermanent: isPermanent,
          },
        });
      } else {
        dataSlice.caseReducers.updateAnnotationCategory(state, {
          type: "updateAnnotationCategory",
          payload: {
            updates: category as PartialBy<
              Category,
              "color" | "name" | "visible"
            >,
            isPermanent: isPermanent,
          },
        });
      }
    },
    deleteAnnotationCategories(
      state,
      action: PayloadAction<{ categoryIds: string[]; isPermanent?: boolean }>
    ) {
      const { categoryIds, isPermanent } = action.payload;
      for (const categoryId of categoryIds) {
        const categoryAnnotationIds = state.annotationsByCategory[categoryId];

        dataSlice.caseReducers.updateAnnotations(state, {
          type: "updateAnnotations",
          payload: {
            updates: categoryAnnotationIds.map((id) => ({
              id,
              categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
            })),
            isPermanent: isPermanent,
          },
        });
        delete state.annotationsByCategory[categoryId];

        if (isPermanent) {
          delete state.annotationCategories.entities[categoryId];
          mutatingFilter(
            state.annotationCategories.ids,
            (catId) => catId !== categoryId
          );
        } else {
          annotationCategoriesAdapter.removeOne(
            state.annotationCategories,
            categoryId
          );
        }
      }
    },
    deleteAllAnnotationCategories(
      state,
      action: PayloadAction<{ isPermanent?: boolean }>
    ) {
      const { isPermanent } = action.payload;
      const idsToDelete = state.annotationCategories.ids.filter(
        (id) => id !== UNKNOWN_ANNOTATION_CATEGORY_ID
      );

      dataSlice.caseReducers.deleteAnnotationCategories(state, {
        type: "deleteAnnotationCategories",
        payload: {
          categoryIds: idsToDelete as string[],
          isPermanent: isPermanent,
        },
      });
    },
    addImages(
      state,
      action: PayloadAction<{ images: Array<ImageType>; isPermanent?: boolean }>
    ) {
      const { images, isPermanent } = action.payload;
      for (const image of images) {
        const nameParts = image.name.split(".");
        const namePrefix = nameParts[0]; //get name before file extension
        const nameSuffix = nameParts.slice(1).join("."); //get file extension

        const existingPrefixes = Object.values(state.images.entities).map(
          (im) => (getDeferredProperty(im, "name") as string).split(".")[0]
        );

        const updatedNamePrefix = replaceDuplicateName(
          namePrefix,
          existingPrefixes
        );

        // add original extension, if it ever existed
        const updatedName =
          nameSuffix === ""
            ? updatedNamePrefix
            : updatedNamePrefix + "." + nameSuffix;

        image.name = updatedName;

        if (state.imageCategories.ids.includes(image.categoryId)) {
          state.imagesByCategory[image.categoryId].push(image.id);
        } else {
          image.categoryId = UNKNOWN_IMAGE_CATEGORY_ID;
          state.imagesByCategory[UNKNOWN_IMAGE_CATEGORY_ID].push(image.id);
        }

        state.annotationsByImage[image.id] = [];
        imagesAdapter.addOne(state.images, image);
        if (isPermanent) {
          state.images.entities[image.id].changes = {};
        }
      }
    },
    uploadImages(
      state,
      action: PayloadAction<{
        files: FileList;
        channels: number;
        slices: number;
        referenceShape: ImageShapeInfo;
        isUploadedFromAnnotator?: boolean;
      }>
    ) {
      // Triggers Middleware
    },
    setImages(
      state,
      action: PayloadAction<{
        images: Array<ImageType>;
        isPermanent?: boolean;
      }>
    ) {
      const { images, isPermanent } = action.payload;

      dataSlice.caseReducers.deleteAllImages(state, {
        type: "deleteAllImages",
        payload: { disposeColorTensors: true },
      });

      dataSlice.caseReducers.addImages(state, {
        type: "AddImages",
        payload: { images, isPermanent: isPermanent },
      });

      //imagesAdapter.setAll(state.images, images, isPermanent);
    },
    clearPredictions(state, action: PayloadAction<{ isPermanent?: boolean }>) {
      const { isPermanent } = action.payload;

      const updates: Array<{ id: string } & Partial<ImageType>> = [];

      state.images.ids.forEach((id) => {
        if (
          (state.images.entities[id].changes &&
            state.images.entities[id].changes.partition ===
              Partition.Inference) ||
          state.images.entities[id].saved.partition === Partition.Inference
        ) {
          updates.push({
            id: id as string,
            categoryId: UNKNOWN_IMAGE_CATEGORY_ID,
            partition: Partition.Unassigned,
          });
        }
      });

      dataSlice.caseReducers.updateImages(state, {
        type: "updateImages",
        payload: {
          updates: updates,
          isPermanent: isPermanent,
        },
      });
    },
    updateImages(
      state,
      action: PayloadAction<{
        updates: Array<{ id: string } & Partial<ImageType>>;
        isPermanent?: boolean;
      }>
    ) {
      const { updates, isPermanent } = action.payload;

      for (const update of updates) {
        const { id, ...changes } = update;

        if (!state.images.ids.includes(id)) continue;

        if (changes.categoryId) {
          const oldCategoryId = getCompleteEntity(
            state.images.entities[id]
          )!.categoryId;
          dataSlice.caseReducers.updateImageByCategoryDict(state, {
            type: "updateImageByCategoryDict",
            payload: {
              imageId: id,
              oldCategoryId,
              newCategoryId: changes.categoryId,
            },
          });
        }

        if (isPermanent) {
          Object.assign(state.images.entities[id].saved, changes);
        } else {
          imagesAdapter.updateOne(state.images, { id, changes });
        }
      }
    },
    updateImageByCategoryDict(
      state,
      action: PayloadAction<{
        imageId: string;
        oldCategoryId: string;
        newCategoryId: string;
      }>
    ) {
      const { imageId, oldCategoryId, newCategoryId } = action.payload;

      if (state.imagesByCategory[newCategoryId].includes(imageId)) return;

      mutatingFilter(
        state.imagesByCategory[oldCategoryId],
        (scopedImageId) => scopedImageId !== imageId
      );

      state.imagesByCategory[newCategoryId].push(imageId);
    },

    deleteImages(
      state,
      action: PayloadAction<{
        imageIds: Array<string>;
        disposeColorTensors: boolean;
        isPermanent?: boolean;
      }>
    ) {
      const { imageIds, disposeColorTensors, isPermanent } = action.payload;
      const disposeColorTensor = disposeColorTensors;
      for (const imageId of imageIds) {
        const imageCategoryId = getDeferredProperty(
          state.images.entities[imageId],
          "categoryId"
        );
        mutatingFilter(
          state.imagesByCategory[imageCategoryId],
          (id) => id !== imageId
        );
        const annotationsToDelete = state.annotationsByImage[imageId];
        if (isPermanent) {
          if (disposeColorTensor) {
            dispose(
              state.images.entities[imageId].saved.data as TensorContainer
            );
            dispose(state.images.entities[imageId].changes as TensorContainer);
          }
          delete state.images.entities[imageId];
          mutatingFilter(state.images.ids, (_imageId) => _imageId !== imageId);
        } else {
          imagesAdapter.removeOne(state.images, imageId);
        }
        dataSlice.caseReducers.deleteAnnotations(state, {
          type: "deleteAnnotations",
          payload: { annotationIds: annotationsToDelete },
        });
      }
    },

    deleteAllImages(
      state,
      action: PayloadAction<{
        disposeColorTensors: boolean;
        isPermanent?: boolean;
      }>
    ) {
      const { disposeColorTensors, isPermanent } = action.payload;
      const imageIds = [...state.images.ids] as string[];
      dataSlice.caseReducers.deleteImages(state, {
        type: "deleteImages",
        payload: {
          imageIds,
          disposeColorTensors,
          isPermanent: isPermanent,
        },
      });
    },

    addAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType | DecodedAnnotationType>;
        isPermanent?: boolean;
      }>
    ) {
      const { annotations, isPermanent } = action.payload;
      for (const annotation of annotations) {
        if (state.annotations.ids.includes(annotation.id)) continue;

        if (annotation.decodedMask) {
          (annotation as AnnotationType).encodedMask = encode(
            annotation.decodedMask
          );
          delete annotation.decodedMask;
        }

        if (!state.annotationCategories.ids.includes(annotation.categoryId)) {
          annotation.categoryId = UNKNOWN_ANNOTATION_CATEGORY_ID;
          state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
            annotation.id
          );
        } else {
          state.annotationsByCategory[annotation.categoryId].push(
            annotation.id
          );
        }
        state.annotationsByImage[annotation.imageId!].push(annotation.id);
        annotationsAdapter.addOne(
          state.annotations,
          annotation as AnnotationType
        );
        if (isPermanent) {
          state.annotations.entities[annotation.id].changes = {};
        }
      }
    },
    setAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
        isPermanent?: boolean;
      }>
    ) {
      const { annotations, isPermanent } = action.payload;
      const withInvalidImageId = [];
      dataSlice.caseReducers.deleteAllAnnotations(state, {
        type: "deleteAllAnnotations",
        payload: {},
      });

      for (const annotation of annotations) {
        if (!state.images.ids.includes(annotation.imageId!)) {
          withInvalidImageId.push(annotation.id);
          continue;
        }
        dataSlice.caseReducers.addAnnotations(state, {
          type: "addAnnotations",
          payload: { annotations: [annotation], isPermanent: isPermanent },
        });
      }
      if (withInvalidImageId.length) {
        console.log(
          `${withInvalidImageId.length} annotations contained an invalid image id: Skipped`
        );
      }
    },
    setAnnotationsByImage(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
        imageId: string;
        isPermanent?: boolean;
      }>
    ) {
      const { annotations, imageId, isPermanent } = action.payload;
      const withInvalidImageId = [];
      dataSlice.caseReducers.deleteAllAnnotationsByImage(state, {
        type: "deleteAllAnnotationsByImage",
        payload: { imageId: imageId },
      });

      for (const annotation of annotations) {
        if (!state.images.ids.includes(annotation.imageId!)) {
          withInvalidImageId.push(annotation.id);
          continue;
        }
        dataSlice.caseReducers.addAnnotations(state, {
          type: "addAnnotations",
          payload: { annotations: [annotation], isPermanent: isPermanent },
        });
      }
      if (withInvalidImageId.length) {
        console.log(
          `${withInvalidImageId.length} annotations contained an invalid image id: Skipped`
        );
      }
    },

    updateAnnotations(
      state,
      action: PayloadAction<{
        updates: Array<{ id: string } & Partial<AnnotationType>>;
        isPermanent?: boolean;
      }>
    ) {
      const { updates, isPermanent } = action.payload;

      for (const update of updates) {
        const { id, ...changes } = update;

        if (!state.annotations.ids.includes(id)) continue;

        if (changes.categoryId) {
          const oldCategoryId = getCompleteEntity(
            state.annotations.entities[id]
          )!.categoryId;
          dataSlice.caseReducers.updateAnnotationByCategoryDict(state, {
            type: "updateAnnotationByCategoryDict",
            payload: {
              annotationId: id,
              oldCategoryId,
              newCategoryId: changes.categoryId,
            },
          });
        }

        if (isPermanent) {
          Object.assign(state.annotations.entities[id].saved, changes);
        } else {
          annotationsAdapter.updateOne(state.annotations, {
            id,
            changes,
          });
        }
      }
    },
    updateAnnotationByCategoryDict(
      state,
      action: PayloadAction<{
        annotationId: string;
        oldCategoryId: string;
        newCategoryId: string;
      }>
    ) {
      const { annotationId, oldCategoryId, newCategoryId } = action.payload;

      if (state.annotationsByCategory[newCategoryId].includes(annotationId))
        return;

      mutatingFilter(
        state.annotationsByCategory[oldCategoryId],
        (scopedAnnotationId) => scopedAnnotationId !== annotationId
      );

      state.annotationsByCategory[newCategoryId].push(annotationId);
    },

    deleteAnnotations(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
        isPermanent?: boolean;
      }>
    ) {
      const { annotationIds, isPermanent } = action.payload;
      const _annotationIds = [...annotationIds];

      for (const annotationId of _annotationIds) {
        if (state.annotations.ids.includes(annotationId)) {
          const imageId = getDeferredProperty(
            state.annotations.entities[annotationId],
            "imageId"
          ) as string;
          const categoryId = getDeferredProperty(
            state.annotations.entities[annotationId],
            "categoryId"
          ) as string;
          mutatingFilter(
            state.annotationsByCategory[categoryId],
            (_annotationId) => _annotationId !== annotationId
          );
          mutatingFilter(
            state.annotationsByImage[imageId],
            (_annotationId) => _annotationId !== annotationId
          );
          if (isPermanent) {
            delete state.annotations.entities[annotationId];
            state.annotations.ids = Object.keys(state.annotations.entities);
          } else {
            annotationsAdapter.removeOne(state.annotations, annotationId);
          }
        }
      }
    },
    deleteAllAnnotationsByImage(
      state,
      action: PayloadAction<{ imageId: string; isPermanent?: boolean }>
    ) {
      const { imageId, isPermanent } = action.payload;
      const annotationIds = state.annotationsByImage[imageId];
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds, isPermanent: isPermanent },
      });
    },
    deleteAllAnnotationsByCategory(
      state,
      action: PayloadAction<{ categoryId: string; isPermanent?: boolean }>
    ) {
      const { categoryId, isPermanent } = action.payload;
      const annotationIds = state.annotationsByCategory[categoryId];
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds, isPermanent: isPermanent },
      });
    },
    deleteImageAnnotationsByCategory(
      state,
      action: PayloadAction<{
        imageId: string;
        categoryId: string;
        isPermanent?: boolean;
      }>
    ) {
      const { imageId, categoryId, isPermanent } = action.payload;
      const annotationIds = state.annotationsByCategory[categoryId].filter(
        (annotationId) => {
          return (
            getDeferredProperty(
              state.annotations.entities[annotationId],
              "imageId"
            ) === imageId
          );
        }
      );

      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotation",
        payload: { annotationIds, isPermanent: isPermanent },
      });
    },
    deleteAllAnnotations(
      state,
      action: PayloadAction<{ isPermanent?: boolean }>
    ) {
      const { isPermanent } = action.payload;
      const annotationIds = [...state.annotations.ids] as Array<string>;
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds, isPermanent: isPermanent },
      });
    },
    reconcile(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {
      const { keepChanges } = action.payload;
      dataSlice.caseReducers._reconcileAnnotations(state, {
        type: "_reconcileAnnotations",
        payload: { keepChanges },
      });
      dataSlice.caseReducers._reconcileAnnotationCategories(state, {
        type: "_reconcileAnnotationCategories",
        payload: { keepChanges },
      });
      dataSlice.caseReducers._reconcileImages(state, {
        type: "_reconcileImages",
        payload: { keepChanges },
      });
      dataSlice.caseReducers._reconcileImageCategories(state, {
        type: "_reconcileImageCategories",
        payload: { keepChanges },
      });

      state.imagesByCategory = { [UNKNOWN_IMAGE_CATEGORY_ID]: [] };
      state.annotationsByCategory = { [UNKNOWN_ANNOTATION_CATEGORY_ID]: [] };
      state.annotationsByImage = {};
      for (const id of state.imageCategories.ids) {
        if (!state.imagesByCategory[id]) {
          state.imagesByCategory[id] = [];
        }
      }
      for (const image of Object.values(state.images.entities)) {
        state.imagesByCategory[image.saved.categoryId].push(image.saved.id);
        state.annotationsByImage[image.saved.id] = [];
      }
      for (const id of state.annotationCategories.ids) {
        if (!state.annotationsByCategory[id]) {
          state.annotationsByCategory[id] = [];
        }
      }
      for (const annotation of Object.values(state.annotations.entities)) {
        state.annotationsByCategory[annotation.saved.categoryId].push(
          annotation.saved.id
        );
        state.annotationsByImage[annotation.saved.imageId!].push(
          annotation.saved.id
        );
      }
    },
    _reconcileAnnotations(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {
      const { keepChanges } = action.payload;
      let hasModifiedIds = false;

      for (const id of state.annotations.ids) {
        const changes = state.annotations.entities[id].changes;
        const hasChanges = Object.keys(changes).length;

        if (hasChanges) {
          if (keepChanges) {
            if (changes.deleted) {
              dispose(
                state.annotations.entities[id].saved.data as TensorContainer
              );
              dispose(
                state.annotations.entities[id].changes as TensorContainer
              );

              delete state.annotations.entities[id];
              hasModifiedIds = true;
            } else {
              let { added, deleted, ...preparedDeferred } = changes;
              Object.assign(
                state.annotations.entities[id].saved!,
                preparedDeferred
              );
              state.annotations.entities[id].changes = {};
            }
          } else {
            // If changes not kept
            if (changes.added) {
              dispose(
                state.annotations.entities[id].saved.data as TensorContainer
              );
              dispose(
                state.annotations.entities[id].changes as TensorContainer
              );

              delete state.annotations.entities[id];

              hasModifiedIds = true;
            } else {
              state.annotations.entities[id].changes = {};
            }
          }
        }
      }

      if (hasModifiedIds) {
        state.annotations.ids = Object.keys(state.annotations.entities);
      }
    },
    _reconcileAnnotationCategories(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {
      const { keepChanges } = action.payload;
      let hasModifiedIds = false;

      for (const id of state.annotationCategories.ids) {
        const changes = state.annotationCategories.entities[id].changes;
        const hasChanges = Object.keys(changes).length;
        if (hasChanges) {
          if (keepChanges) {
            if (changes.deleted) {
              delete state.annotationCategories.entities[id];
              hasModifiedIds = true;
            } else {
              // If category not deleted
              let { added, deleted, ...preparedDeferred } = changes;
              Object.assign(
                state.annotationCategories.entities[id].saved!,
                preparedDeferred
              );
              state.annotationCategories.entities[id].changes = {};
            }
          } else {
            // changes not kept -- update lookup tables
            if (changes.added) {
              delete state.annotationCategories.entities[id];
              hasModifiedIds = true;
            } else {
              // If category not new
              state.annotationCategories.entities[id].changes = {};
            }
          }
        }
      }
      if (hasModifiedIds) {
        state.annotationCategories.ids = Object.keys(
          state.annotationCategories.entities
        );
      }
    },
    _reconcileImages(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {
      const { keepChanges } = action.payload;
      let hasModifiedIds = false;

      for (const id of state.images.ids) {
        const changes = state.images.entities[id].changes;
        const hasChanges = Object.keys(changes).length;
        if (hasChanges) {
          if (keepChanges) {
            if (changes.deleted) {
              dispose(state.images.entities[id].saved.data as TensorContainer);
              dispose(state.images.entities[id].changes as TensorContainer);
              delete state.images.entities[id];
              hasModifiedIds = true;
            } else {
              // If image not deleted
              let { added, deleted, ...preparedDeferred } = changes;
              Object.assign(state.images.entities[id].saved!, preparedDeferred);
              state.images.entities[id].changes = {};
            }
          } else {
            if (changes.added) {
              dispose(state.images.entities[id].saved.data as TensorContainer);
              dispose(state.images.entities[id].changes as TensorContainer);

              delete state.images.entities[id];
              hasModifiedIds = true;
            } else {
              // If image not new

              state.images.entities[id].changes = {};
            }
          }
        }
      }

      if (hasModifiedIds) {
        state.images.ids = Object.keys(state.images.entities);
      }
    },
    _reconcileImageCategories(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {
      const { keepChanges } = action.payload;
      let hasModifiedIds = false;

      for (const id of state.imageCategories.ids) {
        const changes = state.imageCategories.entities[id].changes;
        const hasChanges = Object.keys(changes).length;
        if (hasChanges) {
          if (keepChanges) {
            if (changes.deleted) {
              delete state.imageCategories.entities[id];
              hasModifiedIds = true;
            } else {
              // If category not deleted
              let { added, deleted, ...preparedDeferred } = changes;
              Object.assign(
                state.imageCategories.entities[id].saved!,
                preparedDeferred
              );
              state.imageCategories.entities[id].changes = {};
            }
          } else {
            // changes not kept -- update lookup tables
            if (changes.added) {
              delete state.imageCategories.entities[id];
              hasModifiedIds = true;
            } else {
              // If category not new
              state.imageCategories.entities[id].changes = {};
            }
          }
        }
      }
      if (hasModifiedIds) {
        state.imageCategories.ids = Object.keys(state.imageCategories.entities);
      }
    },
  },
});

export const {
  createImageCategory,
  updateImageCategory,
  setOtherImageCategoriesInvisible,
  createAnnotationCategory,
  addAnnotationCategories,
  updateAnnotationCategory,
  setAnnotationCategories,
  deleteAllAnnotationCategories,
  addAnnotations,
  deleteAllAnnotationsByImage,
  uploadImages,
  initData,
  updateImages,
  setImages,
  updateAnnotations,
  deleteImageAnnotationsByCategory,
  setAnnotations,
} = dataSlice.actions;
