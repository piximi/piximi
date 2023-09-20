import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import { createDeferredEntityAdapter } from "store/entities/create_deferred_adapter";
import { Changes, Deferred, EntityId } from "store/entities/models";
import { getDeferredProperty } from "store/entities/utils";

import {
  ImageType,
  Partition,
  DecodedAnnotationType,
  AnnotationType,
  DataStoreSlice,
  PartialBy,
  Colors,
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

export const initialState = (): DataStoreSlice => {
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
        type: "setImageCategories",
        payload: { categories: newCategories, isPermanent: true },
      });

      dataSlice.caseReducers.addAnnotationCategories(state, {
        type: "setAnnotationCategories",
        payload: {
          annotationCategories: newAnnotationCategories,
          isPermanent: true,
        },
      });

      dataSlice.caseReducers.addImages(state, {
        type: "setImages",
        payload: { images: newImages, isPermanent: true },
      });

      dataSlice.caseReducers.addAnnotations(state, {
        type: "setAnnotations",
        payload: { annotations: newAnnotations, isPermanent: true },
      });
    },
    addImageCategory(
      state,
      action: PayloadAction<{
        category: Category;
        isPermanent?: boolean;
      }>
    ) {
      const category = action.payload.category;
      if (state.imageCategories.ids.includes(category.id)) return;
      state.imagesByCategory[category.id] = [];
      imageCategoriesAdapter.addOne(state.imageCategories, category);
      if (action.payload.isPermanent) {
        state.imageCategories.entities[category.id].changes = {};
      }
    },
    addImageCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      for (const category of action.payload.categories) {
        dataSlice.caseReducers.addImageCategory(state, {
          type: "addImageCategory",
          payload: { category, isPermanent: action.payload.isPermanent },
        });
      }
    },
    createImageCategory(
      state,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      let id = uuidv4();
      let idIsUnique = !state.imageCategories.ids.includes(id);

      while (!idIsUnique) {
        id = uuidv4();
        idIsUnique = !state.imageCategories.ids.includes(id);
      }

      state.imagesByCategory[id] = [];

      imageCategoriesAdapter.addOne(state.imageCategories, {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category);
    },
    updateImageCategory(
      state,
      action: PayloadAction<{
        updates: PartialBy<Category, "color" | "name" | "visible">;
      }>
    ) {
      const { id, ...updates } = action.payload.updates;
      imageCategoriesAdapter.updateOne(state.imageCategories, {
        id: id,
        changes: updates,
      });
    },
    setOtherImageCategoriesInvisible(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      const idsToUpdate = state.imageCategories.ids.filter((id) => {
        return (
          id !== action.payload.id &&
          state.imageCategories.entities[id].saved.visible !== false &&
          state.imageCategories.entities[id].changes?.visible !== false
        );
      });
      const changes = idsToUpdate.map((id) => {
        return { id: id, changes: { visible: false } };
      });
      imageCategoriesAdapter.updateMany(state.imageCategories, changes);
    },
    setImageCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      imageCategoriesAdapter.updateOne(state.imageCategories, {
        id: action.payload.categoryId,
        changes: { visible: action.payload.visible },
      });
    },
    setImageCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      dataSlice.caseReducers.deleteAllImageCategories(state, {
        type: "deleteAllImageCategories",
        payload: {},
      });
      dataSlice.caseReducers.addImageCategories(state, {
        type: "addImageCategories",
        payload: {
          categories: action.payload.categories,
          isPermanent: action.payload.isPermanent,
        },
      });
    },
    upsertImageCategory(
      state,
      action: PayloadAction<{
        category: PartialBy<Category, "id" | "visible">;
      }>
    ) {
      const { category } = action.payload;

      if (!category.id) {
        dataSlice.caseReducers.createImageCategory(state, {
          type: "createImageCategory",
          payload: { name: category.name!, color: category.color! },
        });
      } else {
        dataSlice.caseReducers.updateImageCategory(state, {
          type: "updateImageCategory",
          payload: {
            updates: category as PartialBy<
              Category,
              "color" | "name" | "visible"
            >,
          },
        });
      }
    },
    deleteImageCategory(state, action: PayloadAction<{ categoryId: string }>) {
      const categoryId = action.payload.categoryId;

      // ---- Look Up Reference
      const imageChanges = state.imagesByCategory[categoryId].map((imageId) => {
        return {
          id: imageId,
          changes: { categoryId: UNKNOWN_IMAGE_CATEGORY_ID },
        };
      });
      state.imagesByCategory[UNKNOWN_IMAGE_CATEGORY_ID].push(
        ...state.imagesByCategory[categoryId]
      );
      delete state.imagesByCategory[categoryId];
      // ----

      imagesAdapter.updateMany(state.images, imageChanges);
      imageCategoriesAdapter.removeOne(
        state.imageCategories,
        action.payload.categoryId
      );
    },
    deleteImageCategories(
      state,
      action: PayloadAction<{ categoryIds: string[] }>
    ) {
      for (const categoryId of action.payload.categoryIds) {
        dataSlice.caseReducers.deleteImageCategory(state, {
          type: "deleteImageCategory",
          payload: { categoryId },
        });
      }
    },
    deleteAllImageCategories(state, action: PayloadAction<{}>) {
      // Must create new ids array, otherwise the array will change as deletions occur
      const categories = [...state.imageCategories.ids];
      categories.forEach((categoryId) => {
        dataSlice.caseReducers.deleteImageCategory(state, {
          type: "deleteImageCategory",
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
      action: PayloadAction<{
        annotationCategory: Category;
        isPermanent?: boolean;
      }>
    ) {
      const category = action.payload.annotationCategory;
      state.annotationsByCategory[category.id] = [];
      annotationCategoriesAdapter.addOne(state.annotationCategories, category);
      if (action.payload.isPermanent) {
        state.annotationCategories.entities[category.id].changes = {};
      }
    },
    addAnnotationCategories(
      state,
      action: PayloadAction<{
        annotationCategories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      for (const annotationCategory of action.payload.annotationCategories) {
        dataSlice.caseReducers.addAnnotationCategory(state, {
          type: "addAnnotationCategory",
          payload: {
            annotationCategory,
            isPermanent: action.payload.isPermanent,
          },
        });
      }
    },
    updateAnnotationCategory(
      state,
      action: PayloadAction<{
        updates: PartialBy<Category, "color" | "name" | "visible">;
      }>
    ) {
      const { id, ...updates } = action.payload.updates;
      annotationCategoriesAdapter.updateOne(state.annotationCategories, {
        id: id,
        changes: updates,
      });
    },
    setAnnotationCategory(
      state,
      action: PayloadAction<{ category: Category; isPermanent?: boolean }>
    ) {
      state.annotationsByCategory[action.payload.category.id] = [];
      annotationCategoriesAdapter.setOne(
        state.annotationCategories,
        action.payload.category
      );
      if (action.payload.isPermanent) {
        state.annotationCategories.entities[
          action.payload.category.id
        ].changes.added = false;
      }
    },
    setAnnotationCategories(
      state,
      action: PayloadAction<{
        annotationCategories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
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
      for (const category of action.payload.annotationCategories) {
        dataSlice.caseReducers.setAnnotationCategory(state, {
          type: "setAnnotationCategory",
          payload: { category, isPermanent: action.payload.isPermanent },
        });
      }
    },
    upsertAnnotationCategory(
      state,
      action: PayloadAction<{
        category: PartialBy<Category, "id" | "visible">;
      }>
    ) {
      const { category } = action.payload;

      if (!category.id) {
        dataSlice.caseReducers.createAnnotationCategory(state, {
          type: "createAnnotationCategory",
          payload: { name: category.name!, color: category.color! },
        });
      } else {
        dataSlice.caseReducers.updateAnnotationCategory(state, {
          type: "updateAnnotationCategory",
          payload: {
            updates: category as PartialBy<
              Category,
              "color" | "name" | "visible"
            >,
          },
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
    deleteAnnotationCategories(
      state,
      action: PayloadAction<{ categoryIds: string[] }>
    ) {
      for (const categoryId of action.payload.categoryIds) {
        dataSlice.caseReducers.deleteAnnotationCategory(state, {
          type: "deleteAnnotationCategory",
          payload: { categoryId },
        });
      }
    },
    deleteAllAnnotationCategories(state, action: PayloadAction<{}>) {
      const idsToDelete = state.annotationCategories.ids.filter(
        (id) => id !== UNKNOWN_ANNOTATION_CATEGORY_ID
      );

      dataSlice.caseReducers.deleteAnnotationCategories(state, {
        type: "deleteAnnotationCategories",
        payload: { categoryIds: idsToDelete as string[] },
      });
    },
    addImage(
      state,
      action: PayloadAction<{ image: ImageType; isPermanent?: boolean }>
    ) {
      const image = action.payload.image;

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
      if (action.payload.isPermanent) {
        state.images.entities[image.id].changes = {};
      }
    },
    addImages(
      state,
      action: PayloadAction<{ images: Array<ImageType>; isPermanent?: boolean }>
    ) {
      for (const image of action.payload.images) {
        dataSlice.caseReducers.addImage(state, {
          type: "addImage",
          payload: { image, isPermanent: action.payload.isPermanent },
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
        isUploadedFromAnnotator?: boolean;
      }>
    ) {
      // Triggers Middleware
    },
    setImages(
      state,
      action: PayloadAction<{
        images: Array<ImageType>;
        disposeColorTensors?: boolean;
        isPermanent?: boolean;
      }>
    ) {
      const images = action.payload.images;

      dataSlice.caseReducers.deleteAllImages(state, {
        type: "deleteAllImages",
        payload: { disposeColorTensors: true },
      });

      dataSlice.caseReducers.addImages(state, {
        type: "AddImages",
        payload: { images, isPermanent: action.payload.isPermanent },
      });

      //imagesAdapter.setAll(state.images, images, action.payload.isPermanent);
    },
    setImageSrc(state, action: PayloadAction<{ imgId: string; src: string }>) {
      imagesAdapter.updateOne(state.images, {
        id: action.payload.imgId,
        changes: { src: action.payload.src },
      });
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
            changes: { categoryId: UNKNOWN_IMAGE_CATEGORY_ID },
          });
          mutatingFilter(
            state.imagesByCategory[predictedCategory],
            (_imageId) => _imageId !== imageId
          );

          state.imagesByCategory[UNKNOWN_IMAGE_CATEGORY_ID].push(
            imageId as string
          );
        }
      });
    },
    updateImageCategories(
      state,
      action: PayloadAction<{
        imageIds: Array<string>;
        categoryId: string | undefined;
        isPermanent?: boolean;
      }>
    ) {
      const newCategoryId = action.payload.categoryId;
      if (!newCategoryId) return;
      const changes: Array<Changes<ImageType>> = [];
      for (const imageId of action.payload.imageIds) {
        const categoryId = getDeferredProperty(
          state.images.entities[imageId],
          "categoryId"
        ) as string;
        state.imagesByCategory[categoryId] = state.imagesByCategory[
          categoryId
        ].filter((currentImageId) => currentImageId !== imageId);
        state.imagesByCategory[newCategoryId].push(imageId);

        if (action.payload.isPermanent) {
          state.images.entities[imageId].saved.categoryId = newCategoryId;
        } else {
          changes.push({
            id: imageId,
            changes: { categoryId: action.payload.categoryId },
          });
        }
      }
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
      const { imageId } = action.payload;
      const imageCategoryId = getDeferredProperty(
        state.images.entities[imageId],
        "categoryId"
      );
      mutatingFilter(
        state.imagesByCategory[imageCategoryId],
        (id) => id !== imageId
      );
      imagesAdapter.removeOne(state.images, action.payload.imageId);
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds: state.annotationsByImage[imageId] },
      });
      delete state.annotationsByImage[imageId];
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
        isPermanent?: boolean;
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
    updateImages(
      state,
      action: PayloadAction<{
        updates: Array<{ id: string } & Partial<ImageType>>;
        isPermanent?: boolean;
      }>
    ) {
      for (const update of action.payload.updates) {
        const { id, ...changes } = update;
        dataSlice.caseReducers.updateImage(state, {
          type: "updateImage",
          payload: {
            imageId: id,
            updates: changes,
            isPermanent: action.payload.isPermanent,
          },
        });
      }
    },
    addAnnotation(
      state,
      action: PayloadAction<{
        annotation: AnnotationType | DecodedAnnotationType;
        isPermanent?: boolean;
      }>
    ) {
      let annotation = action.payload.annotation;

      if (state.annotations.ids.includes(annotation.id)) return;

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
        state.annotationsByCategory[annotation.categoryId].push(annotation.id);
      }
      state.annotationsByImage[annotation.imageId!].push(annotation.id);
      annotationsAdapter.addOne(
        state.annotations,
        annotation as AnnotationType
      );
      if (action.payload.isPermanent) {
        state.annotations.entities[annotation.id].changes = {};
      }
    },
    addAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
        isPermanent?: boolean;
      }>
    ) {
      for (const annotation of action.payload.annotations) {
        dataSlice.caseReducers.addAnnotation(state, {
          type: "addAnnotation",
          payload: { annotation, isPermanent: action.payload.isPermanent },
        });
      }
    },
    setAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
        isPermanent?: boolean;
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
          payload: { annotation, isPermanent: action.payload.isPermanent },
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
      const withInvalidImageId = [];
      dataSlice.caseReducers.deleteAllAnnotationsByImage(state, {
        type: "deleteAllAnnotationsByImage",
        payload: { imageId: action.payload.imageId },
      });

      for (const annotation of action.payload.annotations) {
        if (!state.images.ids.includes(annotation.imageId!)) {
          withInvalidImageId.push(annotation.id);
          continue;
        }
        dataSlice.caseReducers.addAnnotation(state, {
          type: "addAnnotation",
          payload: { annotation, isPermanent: action.payload.isPermanent },
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
        isPermanent?: boolean;
      }>
    ) {
      const { annotationId, updates, isPermanent } = action.payload;
      if (!state.annotations.ids.includes(annotationId)) return;

      if (isPermanent) {
        Object.assign(state.annotations.entities[annotationId].saved, updates);
      } else {
        annotationsAdapter.updateOne(state.annotations, {
          id: annotationId,
          changes: updates,
        });
      }
    },
    updateAnnotations(
      state,
      action: PayloadAction<{
        updates: Array<{ id: string } & Partial<AnnotationType>>;
        isPermanent?: boolean;
      }>
    ) {
      for (const update of action.payload.updates) {
        const { id, ...changes } = update;
        dataSlice.caseReducers.updateAnnotation(state, {
          type: "updateAnnotation",
          payload: {
            annotationId: id,
            updates: changes,
            isPermanent: action.payload.isPermanent,
          },
        });
      }
    },
    updateAnnotationCategories(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
        categoryId: string | undefined;
        isPermanent?: boolean;
      }>
    ) {
      const newCategoryId = action.payload.categoryId;
      if (!newCategoryId) return;
      const changes: Array<Changes<ImageType>> = [];
      for (const annotationId of action.payload.annotationIds) {
        const categoryId = getDeferredProperty(
          state.annotations.entities[annotationId],
          "categoryId"
        ) as string;
        state.annotationsByCategory[categoryId] = state.annotationsByCategory[
          categoryId
        ].filter((currentAnnotationId) => currentAnnotationId !== annotationId);
        state.annotationsByCategory[newCategoryId].push(annotationId);

        if (action.payload.isPermanent) {
          state.annotations.entities[annotationId].saved.categoryId =
            newCategoryId;
        } else {
          changes.push({
            id: annotationId,
            changes: { categoryId: action.payload.categoryId },
          });
        }
      }
      annotationsAdapter.updateMany(state.annotations, changes);
    },
    // do not dispatch directly from component, use deleteAnnotation
    // which will call this from a listener
    _deleteAnnotation(
      state,
      action: PayloadAction<{ annotationId: string; isPermanent?: boolean }>
    ) {
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
          state.annotationsByImage[imageId],
          (_annotationId) => _annotationId !== annotationId
        );
        if (action.payload.isPermanent) {
          delete state.annotations.entities[annotationId];
          state.annotations.ids = Object.keys(state.annotations.entities);
        } else {
          annotationsAdapter.removeOne(state.annotations, annotationId);
        }
      }
    },
    deleteAnnotation(
      state,
      action: PayloadAction<{ annotationId: string; isPermanent?: boolean }>
    ) {
      // data listener fires first
    },
    // do not dispatch directly from component, use deleteAnnotations
    // which will call this from a listener
    _deleteAnnotations(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
        isPermanent?: boolean;
      }>
    ) {
      const annotationIds = [...action.payload.annotationIds];

      for (const annotationId of annotationIds) {
        dataSlice.caseReducers._deleteAnnotation(state, {
          type: "_deleteAnnotation",
          payload: { annotationId, isPermanent: action.payload.isPermanent },
        });
      }
    },
    deleteAnnotations(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
        isPermanent?: boolean;
      }>
    ) {
      // data listener fires first
    },
    deleteAllAnnotationsByImage(
      state,
      action: PayloadAction<{ imageId: string; isPermanent?: boolean }>
    ) {
      const annotationIds = state.annotationsByImage[action.payload.imageId];
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds, isPermanent: action.payload.isPermanent },
      });
    },
    deleteAllAnnotationsByCategory(
      state,
      action: PayloadAction<{ categoryId: string; isPermanent?: boolean }>
    ) {
      const annotationIds =
        state.annotationsByCategory[action.payload.categoryId];
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds, isPermanent: action.payload.isPermanent },
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
        payload: { annotationIds, isPermanent: action.payload.isPermanent },
      });
    },
    deleteAllAnnotations(
      state,
      action: PayloadAction<{ isPermanent?: boolean }>
    ) {
      const annotationIds = [...state.annotations.ids] as Array<string>;
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotations",
        payload: { annotationIds, isPermanent: action.payload.isPermanent },
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
  setImageCategoryVisibility,
  setOtherImageCategoriesInvisible,
  deleteImageCategory,
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
  setAnnotations,
} = dataSlice.actions;
