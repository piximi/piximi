import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import {
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CLASS_CATEGORY,
  UNKNOWN_CLASS_CATEGORY_ID,
} from "types/Category";
import { OldImageType, ShadowImageType } from "types/ImageType";
import { Partition } from "types/Partition";
import {
  DecodedAnnotationType,
  EncodedAnnotationType,
} from "types/AnnotationType";
import { DataStoreSlice } from "types";

export const initialState: DataStoreSlice = {
  categories: {
    ids: [UNKNOWN_CLASS_CATEGORY_ID],
    entities: { [UNKNOWN_CLASS_CATEGORY_ID]: UNKNOWN_CLASS_CATEGORY },
  },
  annotationCategories: {
    ids: [UNKNOWN_ANNOTATION_CATEGORY_ID],
    entities: { [UNKNOWN_ANNOTATION_CATEGORY_ID]: UNKNOWN_ANNOTATION_CATEGORY },
  },
  images: { ids: [], entities: {} },
  annotations: { ids: [], entities: {} },
  lookup: {},
};
export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    resetProject: () => initialState,
    addImages(state, action: PayloadAction<{ images: Array<OldImageType> }>) {
      for (const image of action.payload.images) {
        state.images.ids.push(image.id);
        state.images.entities[image.id] = image;
      }
    },
    deleteAnnotationsByCategory(
      state,
      action: PayloadAction<{ imageId: string; categoryId: string }>
    ) {
      // clears annotations of a specified categoru from a specified image

      // finds all annotations with cooresponding catId and imId
      if (!action.payload.imageId) return;
      const imageId = action.payload.imageId;
      const imageCategory = state.images.entities[imageId].categoryId;
      const annotationIds =
        state.lookup[imageCategory][imageId][action.payload.categoryId];
      state.lookup[imageCategory][imageId][action.payload.categoryId] = [];
      // removes annotation from annotation entity and annotation/image lookup
      for (const annotationId of annotationIds) {
        state.annotations.entities[annotationId]!.data?.dispose();
        delete state.annotations.entities[annotationId];
      }

      // generates new annotationId list from entities
      state.annotations.ids = Object.keys(state.annotations.entities);
    },
    clearPredictions(state, action: PayloadAction<{}>) {
      state.images.ids.forEach((imageId) => {
        if (state.images.entities[imageId].partition === Partition.Inference) {
          const predictedCategory = state.images.entities[imageId].categoryId;
          state.images.entities[imageId].categoryId = UNKNOWN_CLASS_CATEGORY_ID;
          state.lookup[UNKNOWN_CLASS_CATEGORY_ID][imageId] =
            state.lookup[predictedCategory][imageId];
          delete state.lookup[predictedCategory][imageId];
        }
      });
    },
    createAnnotationCategory(
      state,
      action: PayloadAction<{ name: string; color: string; id?: string }>
    ) {
      let id = uuidv4();
      let uniqueId = !state.annotationCategories.ids.includes(id);

      while (!uniqueId) {
        id = uuidv4();
        uniqueId = !state.annotationCategories.ids.includes(id);
      }

      state.annotationCategories.ids.push(id);
      state.annotationCategories.entities[id] = {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category;
      state.categories.ids.forEach((catId) => {
        Object.keys(state.lookup[catId]).forEach((imageId) => {
          state.lookup[catId][imageId] = { [id]: [] };
        });
      });
    },

    createCategory(
      state,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      let id = uuidv4();
      let uniqueId = !state.categories.ids.includes(id);

      while (!uniqueId) {
        id = uuidv4();
        uniqueId = !state.categories.ids.includes(id);
      }

      state.categories.ids.push(id);
      state.categories.entities[id] = {
        id: id,
        name: action.payload.name,
        color: action.payload.color,
        visible: true,
      } as Category;
      state.lookup[id] = {};
    },
    deleteAllAnnotationCategories(state, action: PayloadAction<{}>) {
      state.annotations.ids.forEach((id) => {
        state.annotations.entities[id]!.categoryId =
          UNKNOWN_ANNOTATION_CATEGORY_ID;
      });

      state.categories.ids.forEach((catId) => {
        Object.keys(state.lookup[catId]).forEach((imId) => {
          Object.entries(state.lookup[catId][imId]).forEach(
            ([key, annotations]) => {
              if (key !== UNKNOWN_ANNOTATION_CATEGORY_ID) {
                state.lookup[catId][imId][UNKNOWN_ANNOTATION_CATEGORY_ID].push(
                  ...annotations
                );
                delete state.lookup[catId][imId][key];
              }
            }
          );
        });
      });

      state.annotationCategories = initialState.annotationCategories;
    },
    deleteAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string }>
    ) {
      state.categories.ids.forEach((catId) => {
        Object.keys(state.lookup[catId]).forEach((imId) => {
          state.lookup[catId][imId][UNKNOWN_ANNOTATION_CATEGORY_ID].push(
            ...state.lookup[catId][imId][action.payload.categoryId]
          );
        });
      });
      delete state.annotationCategories.entities[action.payload.categoryId];
      state.annotationCategories.ids = Object.keys(
        state.annotationCategories.entities
      );
    },
    deleteAllCategories(state, action: PayloadAction<{}>) {
      state.categories.ids.forEach((catId) => {
        if (catId !== UNKNOWN_CLASS_CATEGORY_ID) {
          state.lookup[UNKNOWN_CLASS_CATEGORY_ID] = {
            ...state.lookup[UNKNOWN_CLASS_CATEGORY_ID],
            ...state.lookup[catId],
          };
          Object.keys(state.lookup[catId]).forEach((imId) => {
            state.images.entities[imId].categoryId = UNKNOWN_CLASS_CATEGORY_ID;
          });
        }

        delete state.lookup[catId];
      });
      state.categories = initialState.categories;
    },

    deleteCategory(state, action: PayloadAction<{ categoryId: string }>) {
      const catId = action.payload.categoryId;
      state.lookup[UNKNOWN_CLASS_CATEGORY_ID] = {
        ...state.lookup[UNKNOWN_CLASS_CATEGORY_ID],
        ...state.lookup[catId],
      };
      Object.keys(state.lookup[catId]).forEach((imId) => {
        state.images.entities[imId].categoryId = UNKNOWN_CLASS_CATEGORY_ID;
      });

      delete state.categories.entities[catId];
      state.categories.ids = Object.keys(state.categories.entities);
      delete state.lookup[catId];
    },
    deleteImages(state, action: PayloadAction<{ ids: Array<string> }>) {
      for (const imageId of action.payload.ids) {
        state.images.entities[imageId].data.dispose();
        const catId = state.images.entities[imageId].categoryId;
        delete state.images.entities[imageId];
        const annotations = Object.values(state.lookup[catId][imageId]).flat();
        for (const annotationId of annotations) {
          state.annotations.entities[annotationId]?.data?.dispose();
          delete state.annotations.entities[annotationId];
        }
        delete state.lookup[catId][imageId];
      }

      state.images.ids = Object.keys(state.images.entities);
      state.annotations.ids = Object.keys(state.annotations.entities);
    },

    deleteAnnotations(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        const { imageId, categoryId } =
          state.annotations.entities[annotationId]!;
        const imageCatId = state.images.entities[imageId!].categoryId;
        state.lookup[imageCatId][imageId!][categoryId] = state.lookup[
          imageCatId
        ][imageId!][categoryId].filter((id) => id !== annotationId);
        state.annotations.entities[annotationId]?.data?.dispose();
      }

      state.annotations.ids = Object.keys(state.annotations.entities);
    },
    deleteAllAnnotations(state, action: PayloadAction<{ imageId: string }>) {
      const imCat = state.images.entities[action.payload.imageId].categoryId;

      for (const anCatId in state.lookup[imCat][action.payload.imageId]) {
        state.lookup[imCat][action.payload.imageId][anCatId] = [];
      }

      state.annotations = initialState.annotations;
    },
    setAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<EncodedAnnotationType>;
        annotationIds: Array<string>;
      }>
    ) {
      const noImage = "no-image";
      const unknownCat = "unknown-category";
      const filteredAnnotations = action.payload.annotations.reduce(
        (
          acc: Record<string, Record<string, EncodedAnnotationType>>,
          ann: EncodedAnnotationType
        ) => {
          if (!state.images.ids.includes(ann.imageId!)) {
            if (acc[noImage]) {
              acc[noImage][ann.id] = ann;
            } else {
              acc[noImage] = { [ann.id]: ann };
            }
          } else {
            if (!state.annotationCategories.ids.includes(ann.categoryId)) {
              ann.categoryId = UNKNOWN_ANNOTATION_CATEGORY_ID;
              if (acc[UNKNOWN_ANNOTATION_CATEGORY_ID]) {
                acc[UNKNOWN_ANNOTATION_CATEGORY_ID][ann.id] = ann;
              } else {
                acc[UNKNOWN_ANNOTATION_CATEGORY_ID] = { [ann.id]: ann };
              }
              if (acc[unknownCat]) {
                acc[unknownCat][ann.id] = ann;
              } else {
                acc[unknownCat] = { [ann.id]: ann };
              }
            } else {
              if (acc[ann.categoryId]) {
                acc[ann.categoryId][ann.id] = ann;
              } else {
                acc[ann.categoryId] = { [ann.id]: ann };
              }
            }
          }
          return acc;
        },
        {}
      );

      state.annotations = initialState.annotations;
      Object.keys(state.lookup).forEach((catId) => {
        Object.keys(state.lookup[catId]).forEach((imId) => {
          Object.keys(state.lookup[catId][imId]).forEach((anCatId) => {
            if (filteredAnnotations[anCatId]) {
              state.lookup[catId][imId][anCatId] = Object.keys(
                filteredAnnotations[anCatId]
              );
              delete filteredAnnotations[anCatId];
              state.annotations.ids.push(
                ...Object.keys(filteredAnnotations[anCatId])
              );
              Object.assign(
                state.annotations.entities,
                filteredAnnotations[anCatId]
              );
            } else {
              state.lookup[catId][imId][anCatId] = [];
            }
          });
        });
      });

      if (filteredAnnotations[noImage] || filteredAnnotations[unknownCat]) {
        console.log(filteredAnnotations);
      }
    },
    reconcile(
      state,
      action: PayloadAction<{
        images: Array<ShadowImageType>;
      }>
    ) {},
    elicnoner(
      state,
      action: PayloadAction<{
        images: Array<ShadowImageType>;
      }>
    ) {},
    reconcileImages(
      state,
      action: PayloadAction<{
        images: Array<ShadowImageType>;
      }>
    ) {},
    setAnnotationCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      let containsUnknown = false;
      state.annotationCategories.ids = [];
      state.annotationCategories.entities = {};
      for (const cat of action.payload.categories) {
        state.annotationCategories.ids.push(cat.id);
        state.annotationCategories.entities[cat.id] = cat;
        if (!containsUnknown)
          containsUnknown = cat.id === UNKNOWN_ANNOTATION_CATEGORY_ID;
      }
      if (!containsUnknown) {
        state.annotationCategories.ids.push(UNKNOWN_ANNOTATION_CATEGORY_ID);
        state.annotationCategories.entities[UNKNOWN_ANNOTATION_CATEGORY_ID] =
          UNKNOWN_ANNOTATION_CATEGORY;
      }
    },
    addAnnotationCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      for (const newCategory of action.payload.categories) {
        const idExists = state.annotationCategories.ids.includes(
          newCategory.id
        );
        if (idExists) {
          const newId = uuidv4();
          state.annotationCategories.ids.push(newId);
          state.annotationCategories.entities[newId] = {
            ...newCategory,
            id: newId,
          };
        } else {
          state.annotationCategories.ids.push(newCategory.id);
          state.annotationCategories.entities[newCategory.id] = newCategory;
        }
      }
    },
    setImageSrc(state, action: PayloadAction<{ imgId: string; src: string }>) {
      state.images.entities[action.payload.imgId].src = action.payload.src;
    },
    setAnnotationCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      state.annotationCategories.entities[action.payload.categoryId].visible =
        action.payload.visible;
    },
    setCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      let containsUnknown = false;
      state.categories.ids = [];
      state.categories.entities = {};
      for (const cat of action.payload.categories) {
        state.categories.ids.push(cat.id);
        state.categories.entities[cat.id] = cat;
        if (!containsUnknown)
          containsUnknown = cat.id === UNKNOWN_CLASS_CATEGORY_ID;
      }
      if (!containsUnknown) {
        state.categories.ids.push(UNKNOWN_CLASS_CATEGORY_ID);
        state.categories.entities[UNKNOWN_CLASS_CATEGORY_ID] =
          UNKNOWN_CLASS_CATEGORY;
      }
    },
    setProjectImages(
      state,
      action: PayloadAction<{ images: Array<OldImageType> }>
    ) {},
    updateImageAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<DecodedAnnotationType>;
        imageId: string;
      }>
    ) {},
    updateImageCategories(
      state,
      action: PayloadAction<{ ids: Array<string>; categoryId: string }>
    ) {},
    updateImageCategory(
      // unused
      state,
      action: PayloadAction<{ id: string; categoryId: string }>
    ) {},
    updateImagesCategories(
      state,
      action: PayloadAction<{ ids: Array<string>; categoryIds: Array<string> }>
    ) {},
    updateImagesPartition(
      state,
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
    ) {},

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
    updateCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      state.categories.entities[action.payload.categoryId].visible =
        action.payload.visible;
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
    updateOtherAnnotationCategoryVisibility(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      for (let id of state.annotationCategories.ids) {
        state.annotationCategories.entities[id].visible =
          action.payload.id === undefined ? true : id === action.payload.id;
      }
    },
    updateOtherCategoryVisibility(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      for (let id of state.categories.ids) {
        state.categories.entities[id].visible =
          action.payload.id === undefined ? true : id === action.payload.id;
      }
    },

    updateSegmentationImagesPartition(
      state,
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
    ) {
      // action.payload.ids.forEach((imageId, idx) => {
      //   const index = state.images.findIndex((image) => {
      //     return image.id === imageId;
      //   });
      //   if (index >= 0) {
      //     state.images[index].partition = action.payload.partition;
      //   }
      // });
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
    uploadImages(
      state,
      action: PayloadAction<{ newImages: Array<OldImageType> }>
    ) {},
    initData(
      state,
      action: PayloadAction<{
        newImages: Array<OldImageType>;
        newAnnotations: Array<EncodedAnnotationType>;
      }>
    ) {
      state.lookup[UNKNOWN_CLASS_CATEGORY_ID] = {};
      for (const image of action.payload.newImages) {
        const { annotations, ...decImage } = image;

        state.images.ids.push(decImage.id);
        state.images.entities[decImage.id] = decImage;
        state.lookup[image.categoryId][image.id] = {
          [UNKNOWN_ANNOTATION_CATEGORY_ID]: [] as string[],
        };
      }
      for (const annotation of action.payload.newAnnotations) {
        state.annotations.ids.push(annotation.id);
        state.annotations.entities[annotation.id] = annotation;
        const thisImage = annotation.imageId!;
        const thisImageCategory =
          state.images.entities[annotation.imageId!].categoryId;
        if (state.lookup[thisImageCategory][thisImage][annotation.categoryId]) {
          state.lookup[thisImageCategory][thisImage][
            annotation.categoryId
          ].push(annotation.id);
        } else {
          state.lookup[thisImageCategory][thisImage][annotation.categoryId] = [
            annotation.id,
          ];
        }
      }
    },
  },
});

export const {
  createCategory,
  createAnnotationCategory,
  uploadImages,
  initData,
  deleteCategory,
  deleteAnnotationCategory,
  deleteAllAnnotationCategories,
  updateCategory,
  updateAnnotationCategory,
  updateCategoryVisibility,
  setImageSrc,
  setAnnotationCategoryVisibility,
  updateImageCategories,
  updateImageCategory,
  updateOtherCategoryVisibility,
  updateOtherAnnotationCategoryVisibility,
  updateSegmentationImagesPartition,
  setAnnotationCategories,
  setProjectImages,
  updateImageAnnotations,
  deleteAnnotationsByCategory,
  addAnnotationCategories,
} = dataSlice.actions;
