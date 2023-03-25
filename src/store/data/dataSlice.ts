import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import {
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CLASS_CATEGORY,
  UNKNOWN_CLASS_CATEGORY_ID,
} from "types/Category";
import { ImageType, OldImageType } from "types/ImageType";
import { Partition } from "types/Partition";
import {
  DecodedAnnotationType,
  EncodedAnnotationType,
} from "types/AnnotationType";
import { Colors } from "types/tensorflow";
import { DataStoreSlice } from "types";
import { ImageShapeInfo, replaceDuplicateName } from "utils/common/image";
import { mutatingFilter } from "utils/common/helpers";

export const initialState = (): DataStoreSlice => {
  return {
    categories: {
      ids: [UNKNOWN_CLASS_CATEGORY_ID],
      entities: { [UNKNOWN_CLASS_CATEGORY_ID]: UNKNOWN_CLASS_CATEGORY },
    },
    annotationCategories: {
      ids: [UNKNOWN_ANNOTATION_CATEGORY_ID],
      entities: {
        [UNKNOWN_ANNOTATION_CATEGORY_ID]: UNKNOWN_ANNOTATION_CATEGORY,
      },
    },
    images: { ids: [], entities: {} },
    annotations: { ids: [], entities: {} },
    annotationsByImage: {},
    annotationsByCategory: { [UNKNOWN_ANNOTATION_CATEGORY_ID]: [] },
    imagesByCategory: { [UNKNOWN_CLASS_CATEGORY_ID]: [] },
  };
};
// TODO: update logic involving OldImageType
export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    initData(
      state,
      action: PayloadAction<{
        images: Array<ImageType>;
        annotations: Array<EncodedAnnotationType>;
        categories: Array<Category>;
        annotationCategories: Array<Category>;
      }>
    ) {
      // TODO: utilize setCategories, setAnnotationCategories, setImages, and setAnnotations
      Object.assign(state, initialState());
      const {
        images: newImages,
        annotations: newAnnotations,
        categories: newCategories,
        annotationCategories: newAnnotationCategories,
      } = action.payload;
      for (const category of newCategories) {
        state.categories.ids.push(category.id);
        state.categories.entities[category.id] = category;
        state.imagesByCategory[category.id] = [];
      }
      for (const category of newAnnotationCategories) {
        state.annotationCategories.ids.push(category.id);
        state.annotationCategories.entities[category.id] = category;
        state.annotationsByCategory[category.id] = [];
      }
      for (const image of newImages) {
        const imageCategoryId = image.categoryId;
        if (state.categories.ids.includes(imageCategoryId)) {
          state.imagesByCategory[imageCategoryId].push(image.id);
          state.annotationsByImage[image.id] = [];
        } else {
          image.categoryId = UNKNOWN_CLASS_CATEGORY_ID;
          state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(image.id);
          state.annotationsByImage[image.id] = [];
        }
        state.images.ids.push(image.id);
        state.images.entities[image.id] = image;
      }
      for (const annotation of newAnnotations) {
        const thisImage = annotation.imageId!;
        if (state.images.ids.includes(thisImage)) {
          state.annotationsByImage[thisImage].push(annotation.id);
          const annotationCategory = annotation.categoryId;
          if (state.annotationCategories.ids.includes(annotationCategory)) {
            state.annotationsByCategory[annotationCategory].push(annotation.id);
          } else {
            annotation.categoryId = UNKNOWN_ANNOTATION_CATEGORY_ID;
            state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
              annotation.id
            );
          }
          state.annotations.ids.push(annotation.id);
          state.annotations.entities[annotation.id] = annotation;
        }
      }
    },
    resetData: () => initialState(),
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

      state.categories.ids.push(id);
      state.categories.entities[id] = {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category;
      state.imagesByCategory[id] = [];
    },
    updateCategory(
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      const oldCategory = state.categories.entities[action.payload.id];
      state.categories.entities[action.payload.id] = {
        ...oldCategory,
        name: action.payload.name,
        color: action.payload.color,
      };
    },
    setOtherCategoriesInvisible(state, action: PayloadAction<{ id?: string }>) {
      for (let id of state.categories.ids) {
        state.categories.entities[id].visible =
          action.payload.id === undefined ? true : id === action.payload.id;
      }
    },
    setCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      state.categories.entities[action.payload.categoryId].visible =
        action.payload.visible;
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
      for (const imageId of state.images.ids) {
        state.images.entities[imageId].categoryId = UNKNOWN_CLASS_CATEGORY_ID;
      }
      for (const category of action.payload.categories) {
        state.categories.ids.push(category.id);
        state.categories.entities[category.id] = category;
        state.imagesByCategory[category.id] = [];
      }
    },
    deleteCategory(state, action: PayloadAction<{ categoryId: string }>) {
      const categoryId = action.payload.categoryId;

      state.imagesByCategory[categoryId].forEach((imageId) => {
        state.images.entities[imageId].categoryId = UNKNOWN_CLASS_CATEGORY_ID;
      });

      state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(
        ...state.imagesByCategory[categoryId]
      );
      delete state.imagesByCategory[categoryId];

      delete state.categories.entities[categoryId];
      state.categories.ids = Object.keys(state.categories.entities);
    },
    deleteAllCategories(state, action: PayloadAction<{}>) {
      const categories = [...state.categories.ids];
      categories.forEach((categoryId) => {
        dataSlice.caseReducers.deleteCategory(state, {
          type: "deleteCategory",
          payload: { categoryId },
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

      state.annotationCategories.ids.push(id);
      state.annotationCategories.entities[id] = {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category;
      state.annotationsByCategory[id] = [];
    },
    addAnnotationCategory(
      state,
      action: PayloadAction<{ annotationCategory: Category }>
    ) {
      const newCategory = action.payload.annotationCategory;
      const idExists = state.annotationCategories.ids.includes(newCategory.id);
      if (idExists) {
        const newId = uuidv4();
        newCategory.id = newId;
      }
      state.annotationCategories.ids.push(newCategory.id);
      state.annotationCategories.entities[newCategory.id] = newCategory;
      state.annotationsByCategory[newCategory.id] = [];
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
      const oldCategory =
        state.annotationCategories.entities[action.payload.id];
      state.annotationCategories.entities[action.payload.id] = {
        ...oldCategory,
        name: action.payload.name,
        color: action.payload.color,
      };
    },
    setAnnotationCategories(
      state,
      action: PayloadAction<{ annotationCategories: Array<Category> }>
    ) {
      state.annotationCategories = initialState().annotationCategories;
      for (const category in state.annotationsByCategory) {
        if (category !== UNKNOWN_ANNOTATION_CATEGORY_ID) {
          state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
            ...state.annotationsByCategory[category]
          );
          delete state.annotationsByCategory[category];
        }
      }
      for (const annotationId of state.annotations.ids) {
        state.annotations.entities[annotationId]!.categoryId =
          UNKNOWN_ANNOTATION_CATEGORY_ID;
      }

      for (const category of action.payload.annotationCategories) {
        state.annotationCategories.ids.push(category.id);
        state.annotationCategories.entities[category.id] = category;
        state.annotationsByCategory[category.id] = [];
      }
    },
    setAnnotationCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      state.annotationCategories.entities[action.payload.categoryId].visible =
        action.payload.visible;
    },
    setOtherAnnotationCategoriesInvisible(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      for (let id of state.annotationCategories.ids) {
        state.annotationCategories.entities[id].visible =
          action.payload.id === undefined ? true : id === action.payload.id;
      }
    },
    deleteAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string }>
    ) {
      state.annotationsByCategory[UNKNOWN_ANNOTATION_CATEGORY_ID].push(
        ...state.annotationsByCategory[action.payload.categoryId]
      );
      delete state.annotationsByCategory[action.payload.categoryId];
      delete state.annotationCategories.entities[action.payload.categoryId];
      state.annotationCategories.ids = Object.keys(
        state.annotationCategories.entities
      );
    },
    deleteAllAnnotationCategories(state, action: PayloadAction<{}>) {
      const annotationCategoryIds = [...state.annotations.ids] as Array<string>;

      annotationCategoryIds.forEach((categoryId) => {
        dataSlice.caseReducers.deleteAnnotationCategory(state, {
          type: "deleteAnnotationCategory",
          payload: { categoryId },
        });
      });

      state.annotationCategories = initialState().annotationCategories;
    },
    addImage(state, action: PayloadAction<{ image: ImageType }>) {
      const image = action.payload.image;

      const initialName = image.name.split(".")[0]; //get name before file extension
      const imageNames = Object.values(state.images.entities).map(
        (image) => image.name
      );
      //add filename extension to updatedName
      const updatedName =
        replaceDuplicateName(initialName, imageNames) +
        "." +
        image.name.split(".").slice(1);
      image.name = updatedName;

      state.images.ids.push(image.id);
      state.images.entities[image.id] = image;
      state.annotationsByImage[image.id] = [];
      if (state.categories.ids.includes(image.categoryId)) {
        state.imagesByCategory[image.categoryId].push(image.id);
      } else {
        image.categoryId = UNKNOWN_CLASS_CATEGORY_ID;
        state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(image.id);
      }
    },
    addImages(state, action: PayloadAction<{ images: Array<OldImageType> }>) {
      const imageNames = Object.values(state.images.entities).map((image) => {
        return image.name.split(".")[0];
      });
      const updatedImages = action.payload.images.map(
        (image: OldImageType, i: number) => {
          const initialName = image.name.split(".")[0]; //get name before file extension
          //add filename extension to updatedName
          const updatedName =
            replaceDuplicateName(initialName, imageNames) +
            "." +
            image.name.split(".").slice(1);
          const { annotations, ...updated } = { ...image, name: updatedName };
          return updated;
        }
      );
      for (const image of updatedImages) {
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
    ) {},
    setImages(
      state,
      action: PayloadAction<{
        images: Array<OldImageType>;
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
    },
    setImageSrc(state, action: PayloadAction<{ imgId: string; src: string }>) {
      state.images.entities[action.payload.imgId].src = action.payload.src;
    },
    setImageInstances(
      state,
      action: PayloadAction<{
        instances: Record<string, Array<EncodedAnnotationType>>;
      }>
    ) {
      Object.entries(action.payload.instances).forEach(
        ([imageId, annotations]) => {
          for (const annotation of annotations) {
            state.annotations.ids.push(annotation.id);
            state.annotations.entities[annotation.id] = annotation;
          }
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
      state.images.entities[action.payload.imageId].src =
        action.payload.renderedSrc;
      state.images.entities[action.payload.imageId].activePlane =
        action.payload.activePlane;
    },
    setImageColors(
      state,
      action: PayloadAction<{
        imageId: string;
        colors: Colors;
        execSaga: boolean;
      }>
    ) {
      state.images.entities[action.payload.imageId].colors =
        action.payload.colors;
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
        if (state.images.entities[imageId].partition === Partition.Inference) {
          const predictedCategory = state.images.entities[imageId].categoryId;
          state.images.entities[imageId].categoryId = UNKNOWN_CLASS_CATEGORY_ID;
          mutatingFilter(
            state.imagesByCategory[predictedCategory],
            (_imageId) => _imageId !== imageId
          );

          state.imagesByCategory[UNKNOWN_CLASS_CATEGORY_ID].push(imageId);
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
        const categoryId = state.images.entities[imageId].categoryId;
        state.images.entities[imageId].categoryId = newCategoryId;
        state.imagesByCategory[categoryId] = state.imagesByCategory[
          categoryId
        ].filter((currentImageId) => currentImageId !== imageId);
        state.imagesByCategory[newCategoryId].push(imageId);
      }
    },
    updateCategoriesOfImages(
      state,
      action: PayloadAction<{
        imageIds: Array<string>;
        categoryIds: Array<string>;
      }>
    ) {
      const { imageIds, categoryIds } = action.payload;
      imageIds.forEach((imageId, idx) => {
        const categoryId = categoryIds[idx];
        const previousCategoryId = state.images.entities[imageId].categoryId;
        state.images.entities[imageId].categoryId = categoryId;
        state.imagesByCategory[categoryId].push(imageId);
        state.imagesByCategory[previousCategoryId] = state.imagesByCategory[
          previousCategoryId
        ].filter((previousImageId) => previousImageId !== imageId);
      });
    },
    updateImagesPartition(
      state,
      action: PayloadAction<{
        imageIdsByPartition: Record<string, Array<string>>;
      }>
    ) {
      Object.entries(action.payload.imageIdsByPartition).forEach(
        ([partition, imageIds]) => {
          for (const imageId of imageIds) {
            state.images.entities[imageId].partition = partition as Partition;
          }
        }
      );
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
      Object.entries(action.payload.imageIdsByPartition).forEach(
        ([partition, imageIds]) => {
          for (const imageId of imageIds) {
            state.images.entities[imageId].partition = partition as Partition;
          }
        }
      );
    },
    setVisibilityOfImages(
      state,
      action: PayloadAction<{ visible: boolean; imageIds: Array<string> }>
    ) {
      for (const imageId of action.payload.imageIds) {
        state.images.entities[imageId].visible = action.payload.visible;
      }
    },
    deleteImage(
      state,
      action: PayloadAction<{ imageId: string; disposeColorTensor: boolean }>
    ) {
      const imageId = action.payload.imageId;
      if (!state.images.ids.includes(imageId)) return;

      const catId = state.images.entities[imageId].categoryId;

      dataSlice.caseReducers.deleteAllAnnotationsByImage(state, {
        type: "deleteAllAnnotationsByImage",
        payload: { imageId },
      });
      mutatingFilter(
        state.imagesByCategory[catId],
        (_imageId: string) => _imageId !== imageId
      );
      delete state.annotationsByImage[imageId];
      state.images.entities[imageId].data.dispose();
      if (action.payload.disposeColorTensor) {
        state.images.entities[imageId].colors.color.dispose();
      }
      delete state.images.entities[imageId];
      state.images.ids = Object.keys(state.images.entities);
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
      const imageIds = [...state.images.ids];
      dataSlice.caseReducers.deleteImages(state, {
        type: "deleteImages",
        payload: { imageIds, disposeColorTensors },
      });
    },
    addAnnotation(
      state,
      action: PayloadAction<{ annotation: EncodedAnnotationType }>
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
      state.annotations.ids.push(annotation.id);
      state.annotations.entities[annotation.id] = annotation;
    },
    addAnnotations(
      state,
      action: PayloadAction<{ annotations: Array<EncodedAnnotationType> }>
    ) {
      for (const annotation of action.payload.annotations) {
        dataSlice.caseReducers.addAnnotation(state, {
          type: "addAnnotation",
          payload: { annotation },
        });
      }
    },
    addAnnotationsByImage(
      state,
      action: PayloadAction<{
        instances: {
          [imageId: string]: Array<EncodedAnnotationType>;
        };
      }>
    ) {},
    setAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<EncodedAnnotationType>;
      }>
    ) {
      const withInvalidImageId = [];
      const annotationIds = action.payload.annotations.map(
        (annotation) => annotation.id
      );
      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAllAnnotations",
        payload: { annotationIds },
      });

      for (const annotation of action.payload.annotations) {
        if (!state.images.ids.includes(annotation.imageId!)) {
          withInvalidImageId.push(annotation.id);
          continue;
        }
        dataSlice.caseReducers.addAnnotation(state, {
          type: "deleteAllAnnotations",
          payload: { annotation },
        });
      }
      if (withInvalidImageId.length) {
        console.log(
          `${withInvalidImageId.length} annotations contained an invalid image id: Skipped`
        );
      }
    },
    deleteAnnotation(state, action: PayloadAction<{ annotationId: string }>) {
      const annotationId = action.payload.annotationId;
      if (!state.annotations.ids.includes(annotationId)) return;
      console.log("here-3");
      const { imageId, categoryId } = state.annotations.entities[annotationId]!;
      mutatingFilter(
        state.annotationsByCategory[categoryId],
        (_annotationId) => _annotationId !== annotationId
      );
      mutatingFilter(
        state.annotationsByImage[imageId!],
        (_annotationId) => _annotationId !== annotationId
      );
      state.annotations.entities[annotationId]?.data?.dispose();
      delete state.annotations.entities[annotationId];
      state.annotations.ids = Object.keys(state.annotations.entities);
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
    deleteAllAnnotations(state, action: PayloadAction<{}>) {
      const annotationIds = [...state.annotations.ids] as Array<string>;
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
          return state.annotations.entities[annotationId]?.imageId === imageId;
        }
      );

      dataSlice.caseReducers.deleteAnnotations(state, {
        type: "deleteAnnotation",
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
  setAnnotationCategoryVisibility,
  setOtherAnnotationCategoriesInvisible,
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
  setImages,
  setVisibilityOfImages,
  setImageActivePlane,
  updateImageAnnotations,
  deleteImageAnnotationsByCategory,
} = dataSlice.actions;
