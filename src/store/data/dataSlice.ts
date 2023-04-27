import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import {
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CLASS_CATEGORY,
  UNKNOWN_CLASS_CATEGORY_ID,
} from "types/Category";
import { ImageType } from "types/ImageType";
import { Partition } from "types/Partition";
import { DecodedAnnotationType, AnnotationType } from "types/AnnotationType";
import { Colors } from "types/tensorflow";
import { DataStoreSlice } from "types";
import { ImageShapeInfo, replaceDuplicateName } from "utils/common/image";
import { mutatingFilter } from "utils/common/helpers";
import { createDeferredEntityAdapter } from "store/entities/create_deferred_adapter";
import { Changes, Deferred, EntityId } from "store/entities/models";
import { getDeferredProperty } from "store/entities/utils";

export const categoriesAdapter = createDeferredEntityAdapter<Category>();
export const annotationCategoriesAdapter =
  createDeferredEntityAdapter<Category>();

export const imagesAdapter = createDeferredEntityAdapter<ImageType>();
export const annotationsAdapter = createDeferredEntityAdapter<AnnotationType>();

export const initialState = (): DataStoreSlice => {
  return {
    categories: categoriesAdapter.getInitialState({
      ids: [UNKNOWN_CLASS_CATEGORY_ID],
      entities: {
        [UNKNOWN_CLASS_CATEGORY_ID]: {
          saved: UNKNOWN_CLASS_CATEGORY,
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
    imagesByCategory: { [UNKNOWN_CLASS_CATEGORY_ID]: [] },
  };
};

// TODO: use createEntities with sorting for entity values
export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    initData(
      state,
      action: PayloadAction<{
        images: Array<ImageType>;
        annotations: Array<AnnotationType>;
        categories: Array<Category>;
        annotationCategories: Array<Category>;
      }>
    ) {
      Object.assign(state, initialState());
      const {
        images: newImages,
        annotations: newAnnotations,
        categories: newCategories,
        annotationCategories: newAnnotationCategories,
      } = action.payload;
      dataSlice.caseReducers.addCategories(state, {
        type: "addCategories",
        payload: { categories: newCategories },
      });
      dataSlice.caseReducers.addAnnotationCategories(state, {
        type: "addAnnotationCategories",
        payload: { annotationCategories: newAnnotationCategories },
      });
      dataSlice.caseReducers.addImages(state, {
        type: "addImages",
        payload: { images: newImages },
      });
      dataSlice.caseReducers.addAnnotations(state, {
        type: "addAnnotations",
        payload: { annotations: newAnnotations },
      });
    },
    resetData: () => initialState(),
    addCategory(
      state,
      action: PayloadAction<{
        category: Category;
      }>
    ) {
      const category = action.payload.category;
      if (state.categories.ids.includes(category.id)) return;
      state.imagesByCategory[category.id] = [];
      categoriesAdapter.addOne(state.categories, category);
    },
    addCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
      }>
    ) {
      for (const category of action.payload.categories) {
        dataSlice.caseReducers.addCategory(state, {
          type: "addCategory",
          payload: { category },
        });
      }
    },
    createCategory(
      state,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      let id = uuidv4();
      let idIsUnique = !state.categories.ids.includes(id);

      while (!idIsUnique) {
        id = uuidv4();
        idIsUnique = !state.categories.ids.includes(id);
      }

      state.imagesByCategory[id] = [];

      categoriesAdapter.addOne(state.categories, {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category);
    },
    updateCategory(
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      categoriesAdapter.updateOne(state.categories, {
        id: action.payload.id,
        changes: { name: action.payload.name, color: action.payload.color },
      });
    },
    setOtherCategoriesInvisible(state, action: PayloadAction<{ id?: string }>) {
      const idsToUpdate = state.categories.ids.filter((id) => {
        return (
          id !== action.payload.id &&
          state.categories.entities[id].saved.visible !== false &&
          state.categories.entities[id].changes?.visible !== false
        );
      });
      const changes = idsToUpdate.map((id) => {
        return { id: id, changes: { visible: false } };
      });
      categoriesAdapter.updateMany(state.categories, changes);
    },
    setCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      categoriesAdapter.updateOne(state.categories, {
        id: action.payload.categoryId,
        changes: { visible: action.payload.visible },
      });
    },
    setCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = initialState().categories;
      for (const category in state.imagesByCategory) {
        if (category !== UNKNOWN_CLASS_CATEGORY_ID) {
          state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(
            ...state.imagesByCategory[category]
          );
          delete state.imagesByCategory[category];
        }
      }
      for (const category of action.payload.categories) {
        state.imagesByCategory[category.id] = [];
      }
      const changes = state.images.ids.map((id) => {
        return { id, changes: { categoryId: UNKNOWN_CLASS_CATEGORY_ID } };
      });
      imagesAdapter.updateMany(state.images, changes);
      categoriesAdapter.setMany(state.categories, action.payload.categories);
    },
    deleteCategory(state, action: PayloadAction<{ categoryId: string }>) {
      const categoryId = action.payload.categoryId;

      // ---- Look Up Reference
      const imageChanges = state.imagesByCategory[categoryId].map((imageId) => {
        return {
          id: imageId,
          changes: { categoryId: UNKNOWN_CLASS_CATEGORY_ID },
        };
      });
      state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(
        ...state.imagesByCategory[categoryId]
      );
      delete state.imagesByCategory[categoryId];
      // ----

      imagesAdapter.updateMany(state.images, imageChanges);
      categoriesAdapter.removeOne(state.categories, action.payload.categoryId);
    },
    deleteAllCategories(state, action: PayloadAction<{}>) {
      // Must create new ids array, otherwise the array will change as deletions occur
      const categories = [...state.categories.ids];
      categories.forEach((categoryId) => {
        dataSlice.caseReducers.deleteCategory(state, {
          type: "deleteCategory",
          payload: { categoryId: categoryId as string },
        });
      });
    },
    createAnnotationCategory(
      state,
      action: PayloadAction<{ name: string; color: string; id?: string }>
    ) {
      let id = uuidv4();
      let idIsUnique = !state.annotationCategories.ids.includes(id);

      while (!idIsUnique) {
        id = uuidv4();
        idIsUnique = !state.annotationCategories.ids.includes(id);
      }

      const newCategory = {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category;
      annotationCategoriesAdapter.addOne(
        state.annotationCategories,
        newCategory
      );
      state.annotationsByCategory[id] = [];
    },
    addAnnotationCategory(
      state,
      action: PayloadAction<{ annotationCategory: Category }>
    ) {
      const category = action.payload.annotationCategory;
      state.annotationsByCategory[category.id] = [];
      annotationCategoriesAdapter.addOne(state.annotationCategories, category);
    },
    addAnnotationCategories(
      state,
      action: PayloadAction<{ annotationCategories: Array<Category> }>
    ) {
      for (const annotationCategory of action.payload.annotationCategories) {
        dataSlice.caseReducers.addAnnotationCategory(state, {
          type: "addAnnotationCategory",
          payload: { annotationCategory },
        });
      }
    },
    updateAnnotationCategory(
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      annotationCategoriesAdapter.updateOne(state.annotationCategories, {
        id: action.payload.id,
        changes: { name: action.payload.name, color: action.payload.color },
      });
    },
    setAnnotationCategory(
      state,
      action: PayloadAction<{ category: Category }>
    ) {
      state.annotationsByCategory[action.payload.category.id] = [];
      annotationCategoriesAdapter.setOne(
        state.annotationCategories,
        action.payload.category
      );
    },
    setAnnotationCategories(
      state,
      action: PayloadAction<{ annotationCategories: Array<Category> }>
    ) {
      for (const category in state.annotationsByCategory) {
        if (category !== UNKNOWN_ANNOTATION_CATEGORY_ID) {
          state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
            ...state.annotationsByCategory[category]
          );
          delete state.annotationsByCategory[category];
        }
      }
      for (const annotationId of state.annotations.ids) {
        annotationsAdapter.updateOne(state.annotations, {
          id: annotationId,
          changes: { categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID },
        });
      }
      for (const category of action.payload.annotationCategories) {
        dataSlice.caseReducers.setAnnotationCategory(state, {
          type: "setAnnotationCategory",
          payload: { category },
        });
      }
    },
    deleteAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: EntityId }>
    ) {
      state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
        ...state.annotationsByCategory[action.payload.categoryId]
      );
      const categoryAnnotationIds =
        state.annotationsByCategory[action.payload.categoryId];
      delete state.annotationsByCategory[action.payload.categoryId];

      annotationCategoriesAdapter.removeOne(
        state.annotationCategories,
        action.payload.categoryId
      );

      for (const annotationId of categoryAnnotationIds) {
        dataSlice.caseReducers.updateAnnotation(state, {
          type: "updateAnnotation",
          payload: {
            annotationId,
            updates: { categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID },
          },
        });
      }
    },
    deleteAllAnnotationCategories(state, action: PayloadAction<{}>) {
      const idsToDelete = state.annotationCategories.ids.filter(
        (id) => id !== UNKNOWN_ANNOTATION_CATEGORY_ID
      );

      idsToDelete.forEach((categoryId) => {
        dataSlice.caseReducers.deleteAnnotationCategory(state, {
          type: "deleteAnnotationCategory",
          payload: { categoryId },
        });
      });

      annotationCategoriesAdapter.removeMany(
        state.annotationCategories,
        idsToDelete
      );

      state.annotationCategories = initialState().annotationCategories;
    },
    addImage(state, action: PayloadAction<{ image: ImageType }>) {
      const image = action.payload.image;

      const initialName = image.name.split(".")[0]; //get name before file extension
      const imageNames = Object.values(state.images.entities).map(
        (image) => getDeferredProperty(image, "name") as string
      );
      //add filename extension to updatedName
      const updatedName =
        replaceDuplicateName(initialName, imageNames) +
        "." +
        image.name.split(".").slice(1);
      image.name = updatedName;

      if (state.categories.ids.includes(image.categoryId)) {
        state.imagesByCategory[image.categoryId].push(image.id);
      } else {
        image.categoryId = UNKNOWN_CLASS_CATEGORY_ID;
        state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(image.id);
      }

      state.annotationsByImage[image.id] = [];
      imagesAdapter.addOne(state.images, image);
    },
    addImages(state, action: PayloadAction<{ images: Array<ImageType> }>) {
      for (const image of action.payload.images) {
        dataSlice.caseReducers.addImage(state, {
          type: "addImage",
          payload: { image },
        });
      }
    },
    uploadImages(
      state,
      action: PayloadAction<{
        files: FileList;
        channels: number;
        slices: number;
        referenceShape: ImageShapeInfo;
        isUploadedFromAnnotator: boolean;
        execSaga: boolean;
      }>
    ) {
      // Triggers Middleware
    },
    setImages(
      state,
      action: PayloadAction<{
        images: Array<ImageType>;
        disposeColorTensors: boolean;
      }>
    ) {
      const images = action.payload.images;

      dataSlice.caseReducers.deleteAllImages(state, {
        type: "deleteAllImages",
        payload: { disposeColorTensors: true },
      });
      dataSlice.caseReducers.addImages(state, {
        type: "deleteAllImages",
        payload: { images },
      });

      imagesAdapter.setAll(state.images, action.payload.images);
    },
    setImageSrc(state, action: PayloadAction<{ imgId: string; src: string }>) {
      imagesAdapter.updateOne(state.images, {
        id: action.payload.imgId,
        changes: { src: action.payload.src },
      });
    },

    //TODO: this shoukd be annotation
    setImageInstances(
      state,
      action: PayloadAction<{
        instances: Record<string, Array<AnnotationType>>;
      }>
    ) {
      Object.entries(action.payload.instances).forEach(
        ([imageId, annotations]) => {
          state.annotationsByImage[imageId] = annotations.map(
            (annotation) => annotation.id
          );
        }
      );
    },
    setImageActivePlane(
      state,
      action: PayloadAction<{
        imageId: string;
        activePlane: number;
        renderedSrc: string;
      }>
    ) {
      imagesAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: {
          src: action.payload.renderedSrc,
          activePlane: action.payload.activePlane,
        },
      });
    },
    setImageColors(
      state,
      action: PayloadAction<{
        imageId: string;
        colors: Colors;
        execSaga: boolean;
      }>
    ) {
      imagesAdapter.updateOne(state.images, {
        id: action.payload.imageId,
        changes: { colors: action.payload.colors },
      });
    },

    updateImageAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<DecodedAnnotationType>;
        imageId: string;
      }>
    ) {},
    clearPredictions(state, action: PayloadAction<{}>) {
      state.images.ids.forEach((imageId) => {
        if (
          state.images.entities[imageId].saved.partition ===
            Partition.Inference ||
          (state.images.entities[imageId].changes.partition &&
            state.images.entities[imageId].changes.partition ===
              Partition.Inference)
        ) {
          const predictedCategory = getDeferredProperty(
            state.images.entities[imageId],
            "categoryId"
          ) as string;
          imagesAdapter.updateOne(state.images, {
            id: imageId,
            changes: { categoryId: UNKNOWN_CLASS_CATEGORY_ID },
          });
          mutatingFilter(
            state.imagesByCategory[predictedCategory],
            (_imageId) => _imageId !== imageId
          );

          state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(
            imageId as string
          );
        }
      });
    },
    updateImageCategories(
      // unused
      state,
      action: PayloadAction<{
        imageIds: Array<string>;
        categoryId: string | null;
      }>
    ) {
      const newCategoryId = action.payload.categoryId;
      if (!newCategoryId) return;

      for (const imageId of action.payload.imageIds) {
        const categoryId = getDeferredProperty(
          state.images.entities[imageId],
          "categoryId"
        ) as string;
        state.imagesByCategory[categoryId] = state.imagesByCategory[
          categoryId
        ].filter((currentImageId) => currentImageId !== imageId);
        state.imagesByCategory[newCategoryId].push(imageId);
      }
      const changes = action.payload.imageIds.map((id) => {
        return {
          id,
          changes: { categoryId: action.payload.categoryId },
        } as Changes<ImageType>;
      });
      imagesAdapter.updateMany(state.images, changes);
    },
    updateCategoriesOfImages(
      state,
      action: PayloadAction<{
        imageIds: Array<string>;
        categoryIds: Array<string>;
      }>
    ) {
      const { imageIds, categoryIds } = action.payload;
      if (imageIds.length !== categoryIds.length) {
        return;
      }

      imageIds.forEach((imageId, idx) => {
        const categoryId = categoryIds[idx];
        const previousCategoryId = getDeferredProperty(
          state.images.entities[imageId],
          "categoryId"
        ) as string;
        state.imagesByCategory[categoryId].push(imageId);
        mutatingFilter(
          state.imagesByCategory[previousCategoryId],
          (previousImageId) => previousImageId !== imageId
        );
      });
      const changes = action.payload.imageIds.map((id, idx) => {
        return {
          id,
          changes: { categoryId: action.payload.categoryIds[idx] },
        } as Changes<ImageType>;
      });
      imagesAdapter.updateMany(state.images, changes);
    },
    updateImagesPartition(
      state,
      action: PayloadAction<{
        imageIdsByPartition: Record<string, Array<string>>;
      }>
    ) {
      const changes: Changes<ImageType>[] = [];
      Object.entries(action.payload.imageIdsByPartition).forEach(
        ([partition, imageIds]) => {
          for (const imageId of imageIds) {
            changes.push({
              id: imageId,
              changes: { partition: partition as Partition },
            });
          }
        }
      );
      imagesAdapter.updateMany(state.images, changes);
    },

    updateLabeledImagesVisibility(
      state,
      action: PayloadAction<{ visibility: boolean }>
    ) {
      // state.images.forEach((image) => {
      //   if (image.partition !== Partition.Inference) {
      //     image.visible = action.payload.visibility;
      //   }
      // });
    },

    updateSegmentationImagesPartition(
      state,
      action: PayloadAction<{
        imageIdsByPartition: Record<string, Array<string>>;
      }>
    ) {
      const changes: Changes<ImageType>[] = [];
      Object.entries(action.payload.imageIdsByPartition).forEach(
        ([partition, imageIds]) => {
          for (const imageId of imageIds) {
            changes.push({
              id: imageId,
              changes: { partition: partition as Partition },
            });
          }
        }
      );
      imagesAdapter.updateMany(state.images, changes);
    },
    setVisibilityOfImages(
      state,
      action: PayloadAction<{ visible: boolean; imageIds: Array<string> }>
    ) {
      const changes = action.payload.imageIds.map((id) => {
        return { id, changes: { visible: action.payload.visible } };
      });
      imagesAdapter.updateMany(state.images, changes);
    },

    deleteImage(
      state,
      action: PayloadAction<{ imageId: string; disposeColorTensor?: boolean }>
    ) {
      imagesAdapter.removeOne(state.images, action.payload.imageId);
    },

    deleteImages(
      state,
      action: PayloadAction<{
        imageIds: Array<string>;
        disposeColorTensors: boolean;
      }>
    ) {
      const disposeColorTensor = action.payload.disposeColorTensors;
      for (const imageId of action.payload.imageIds) {
        dataSlice.caseReducers.deleteImage(state, {
          type: "deleteImage",
          payload: { imageId, disposeColorTensor },
        });
      }
    },

    deleteAllImages(
      state,
      action: PayloadAction<{ disposeColorTensors: boolean }>
    ) {
      const disposeColorTensors = action.payload.disposeColorTensors;
      const imageIds = [...state.images.ids] as string[];
      dataSlice.caseReducers.deleteImages(state, {
        type: "deleteImages",
        payload: { imageIds, disposeColorTensors },
      });
    },

    updateImage(
      state,
      action: PayloadAction<{
        imageId: string;
        updates: Partial<ImageType>;
        execSaga?: boolean;
      }>
    ) {
      const { imageId, updates } = action.payload;

      if (state.images.ids.includes(imageId)) {
        const changes = {
          id: imageId,
          changes: updates as Deferred<ImageType>,
        };

        imagesAdapter.updateOne(state.images, changes);
        return;
      }
    },
    addAnnotation(
      state,
      action: PayloadAction<{ annotation: AnnotationType }>
    ) {
      const annotation = action.payload.annotation;
      if (!state.annotationCategories.ids.includes(annotation.categoryId)) {
        annotation.categoryId = UNKNOWN_ANNOTATION_CATEGORY_ID;
        state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
          annotation.id
        );
      } else {
        state.annotationsByCategory[annotation.categoryId].push(annotation.id);
      }
      state.annotationsByImage[annotation.imageId!].push(annotation.id);
      annotationsAdapter.addOne(state.annotations, action.payload.annotation);
    },
    addAnnotations(
      state,
      action: PayloadAction<{ annotations: Array<AnnotationType> }>
    ) {
      for (const annotation of action.payload.annotations) {
        dataSlice.caseReducers.addAnnotation(state, {
          type: "addAnnotation",
          payload: { annotation },
        });
      }
    },
    setAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
      }>
    ) {
      const withInvalidImageId = [];
      dataSlice.caseReducers.deleteAllAnnotations(state, {
        type: "deleteAllAnnotations",
        payload: {},
      });

      for (const annotation of action.payload.annotations) {
        if (!state.images.ids.includes(annotation.imageId!)) {
          withInvalidImageId.push(annotation.id);
          continue;
        }
        dataSlice.caseReducers.addAnnotation(state, {
          type: "addAnnotation",
          payload: { annotation },
        });
      }
      if (withInvalidImageId.length) {
        console.log(
          `${withInvalidImageId.length} annotations contained an invalid image id: Skipped`
        );
      }
    },
    updateAnnotation(
      state,
      action: PayloadAction<{
        annotationId: string;
        updates: Deferred<AnnotationType>;
      }>
    ) {
      const { annotationId, updates } = action.payload;
      if (!state.annotations.ids.includes(annotationId)) return;

      annotationsAdapter.updateOne(state.annotations, {
        id: annotationId,
        changes: updates,
      });
    },
    updateAnnotations(
      state,
      action: PayloadAction<{
        updates: Array<{ id: string } & Partial<AnnotationType>>;
      }>
    ) {
      for (const update of action.payload.updates) {
        const { id, ...changes } = update;
        dataSlice.caseReducers.updateAnnotation(state, {
          type: "updateAnnotation",
          payload: { annotationId: id, updates: changes },
        });
      }
    },
    deleteAnnotation(state, action: PayloadAction<{ annotationId: string }>) {
      const annotationId = action.payload.annotationId;
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
          state.annotationsByImage[imageId!],
          (_annotationId) => _annotationId !== annotationId
        );
        annotationsAdapter.removeOne(state.annotations, annotationId);
      }
    },
    deleteAnnotations(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      const annotationIds = [...action.payload.annotationIds];

      for (const annotationId of annotationIds) {
        dataSlice.caseReducers.deleteAnnotation(state, {
          type: "deleteAnnotation",
          payload: { annotationId },
        });
      }
    },
    deleteAllAnnotationsByImage(
      state,
      action: PayloadAction<{ imageId: string }>
    ) {
      const annotationIds = state.annotationsByImage[action.payload.imageId];
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds },
      });
    },
    deleteAllAnnotationsByCategory(
      state,
      action: PayloadAction<{ categoryId: string }>
    ) {
      const annotationIds =
        state.annotationsByCategory[action.payload.categoryId];
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds },
      });
    },
    deleteImageAnnotationsByCategory(
      state,
      action: PayloadAction<{ imageId: string; categoryId: string }>
    ) {
      const { imageId, categoryId } = action.payload;
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
        payload: { annotationIds },
      });
    },
    deleteAllAnnotations(state, action: PayloadAction<{}>) {
      const annotationIds = [...state.annotations.ids] as Array<string>;
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds },
      });
    },
  },
});

export const {
  createCategory,
  updateCategory,
  setCategoryVisibility,
  setOtherCategoriesInvisible,
  deleteCategory,
  createAnnotationCategory,
  addAnnotationCategories,
  updateAnnotationCategory,
  setAnnotationCategories,
  deleteAnnotationCategory,
  deleteAllAnnotationCategories,
  addAnnotations,
  deleteAllAnnotationsByImage,
  uploadImages,
  initData,
  setImageSrc,
  updateImageCategories,
  updateCategoriesOfImages,
  updateSegmentationImagesPartition,
  updateImage,
  setImages,
  setVisibilityOfImages,
  setImageActivePlane,
  updateImageAnnotations,
  updateAnnotation,
  updateAnnotations,
  deleteImageAnnotationsByCategory,
} = dataSlice.actions;
