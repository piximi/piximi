import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { filter } from "lodash";
import { v4 as uuidv4 } from "uuid";

import { Project } from "types/Project";
import {
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CLASS_CATEGORY,
  UNKNOWN_CLASS_CATEGORY_ID,
} from "types/Category";
import { ImageType, ShadowImageType } from "types/ImageType";
import { Partition } from "types/Partition";
import { defaultImageSortKey, ImageSortKeyType } from "types/ImageSortType";
import { AnnotationType } from "types/AnnotationType";
import { replaceDuplicateName } from "image/utils/imageHelper";

export const initialState: Project = {
  categories: [UNKNOWN_CLASS_CATEGORY],
  annotationCategories: [UNKNOWN_ANNOTATION_CATEGORY],
  images: [],
  name: "Untitled project",
  imageSortKey: defaultImageSortKey,
  highlightedCategory: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    addImages(state, action: PayloadAction<{ images: Array<ImageType> }>) {
      state.images = state.images.concat(action.payload.images);
    },
    clearAnnotations(state, action: PayloadAction<{ category: Category }>) {
      for (let image of state.images) {
        image.annotations = image.annotations.filter(
          (annotation: AnnotationType) => {
            return annotation.categoryId !== action.payload.category.id;
          }
        );
      }
    },
    clearPredictions(state, action: PayloadAction<{}>) {
      state.images.forEach((image) => {
        if (image.partition === Partition.Inference) {
          image.categoryId = UNKNOWN_CLASS_CATEGORY_ID;
        }
      });
    },
    createAnnotationCategory(
      state,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      const category: Category = {
        color: action.payload.color,
        id: uuidv4().toString(),
        name: action.payload.name,
        visible: true,
      };
      state.annotationCategories.push(category);
    },
    createCategory(
      state,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      const category: Category = {
        color: action.payload.color,
        id: uuidv4().toString(),
        name: action.payload.name,
        visible: true,
      };
      state.categories.push(category);
    },
    createNewProject(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
      state.categories = [UNKNOWN_CLASS_CATEGORY];
      state.annotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];
      state.images = [];
      state.imageSortKey = defaultImageSortKey;
    },
    deleteAllAnnotationCategories(state, action: PayloadAction<{}>) {
      state.annotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];

      state.images = state.images.map((image) => {
        const instances = image.annotations.map(
          (annotation: AnnotationType) => {
            return {
              ...annotation,
              categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
            };
          }
        );

        return { ...image, annotations: instances };
      });
    },
    deleteAllCategories(state, action: PayloadAction<{}>) {
      state.categories = [UNKNOWN_CLASS_CATEGORY];

      state.images = state.images.map((image) => {
        image.categoryId = UNKNOWN_CLASS_CATEGORY_ID;
        image.partition = Partition.Inference;
        return image;
      });
    },
    deleteAnnotationCategory(
      state,
      action: PayloadAction<{ categoryID: string }>
    ) {
      state.annotationCategories = state.annotationCategories.filter(
        (category: Category) => category.id !== action.payload.categoryID
      );

      state.images = state.images.map((image) => {
        const instances = image.annotations.map(
          (annotation: AnnotationType) => {
            if (annotation.categoryId === action.payload.categoryID) {
              return {
                ...annotation,
                categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
              };
            } else {
              return annotation;
            }
          }
        );

        return { ...image, annotations: instances };
      });
    },
    deleteCategory(state, action: PayloadAction<{ id: string }>) {
      state.categories = filter(state.categories, (category: Category) => {
        return category.id !== action.payload.id;
      });
      state.images = state.images.map((image) => {
        if (image.categoryId === action.payload.id) {
          image.categoryId = UNKNOWN_CLASS_CATEGORY_ID;
          image.partition = Partition.Inference;
        }
        return image;
      });
    },
    deleteImages(state, action: PayloadAction<{ ids: Array<string> }>) {
      const remainingImages: typeof state.images = [];

      for (const im of state.images) {
        if (action.payload.ids.includes(im.id)) {
          im.data.dispose();
          im.colors.color.dispose();
        } else {
          remainingImages.push(im);
        }
      }

      state.images = remainingImages;
    },
    setProject(state, action: PayloadAction<{ project: Project }>) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.project;
      return action.payload.project;
    },
    reconcileImages(
      state,
      action: PayloadAction<{
        images: Array<ShadowImageType>;
      }>
    ) {
      action.payload.images.forEach((shadowImage: ShadowImageType) => {
        const projectImageIdx = state.images.findIndex((image) => {
          return shadowImage.id === image.id;
        });

        if (projectImageIdx >= 0) {
          const projectImage = state.images[projectImageIdx];

          projectImage.colors.color.dispose();

          state.images[projectImageIdx] = {
            ...projectImage,
            ...shadowImage,
          };
        }
      });
    },
    setAnnotationCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      const replaceUnknown =
        action.payload.categories.find(
          (cat) => cat.id === UNKNOWN_ANNOTATION_CATEGORY_ID
        ) === undefined;
      if (replaceUnknown) {
        state.annotationCategories = [
          UNKNOWN_ANNOTATION_CATEGORY,
          ...action.payload.categories,
        ];
      } else {
        state.annotationCategories = action.payload.categories;
      }
    },
    addAnnotationCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      const newCategories = [];
      for (const newCategory of action.payload.categories) {
        const idExists = state.annotationCategories.find(
          (c) => c.id === newCategory.id
        );
        if (idExists) {
          newCategories.push({
            ...newCategory,
            id: uuidv4(),
          });
        } else {
          newCategories.push(newCategory);
        }
      }
      state.annotationCategories.push(...newCategories);
    },
    setAnnotationCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      const index = state.annotationCategories.findIndex(
        (category: Category) => {
          return category.id === action.payload.categoryId;
        }
      );
      state.annotationCategories[index].visible = action.payload.visible;
    },
    setCategories(
      state,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = [...state.categories, ...action.payload.categories];
    },
    setImages(state, action: PayloadAction<{ images: Array<ImageType> }>) {
      state.images = action.payload.images;
    },
    sortImagesBySelectedKey(
      state,
      action: PayloadAction<{ imageSortKey: ImageSortKeyType }>
    ) {
      const selectedSortKey = action.payload.imageSortKey;
      state.imageSortKey = selectedSortKey;

      (state.images as ImageType[]).sort(selectedSortKey.comparerFunction);
    },
    setProjectName(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
    },
    updateCategory(
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      const index = state.categories.findIndex((category: Category) => {
        return category.id === action.payload.id;
      });
      state.categories[index].name = action.payload.name;
      state.categories[index].color = action.payload.color;
    },
    updateHighlightedCategory(
      state,
      action: PayloadAction<{ categoryIndex: number }>
    ) {
      const index = action.payload.categoryIndex;
      if (!isNaN(index) && index < state.categories.length) {
        const categoryId = state.categories[action.payload.categoryIndex].id;
        state.highlightedCategory = categoryId;
      } else {
        state.highlightedCategory = null;
      }
    },
    updateCategoryVisibility(
      state,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      const index = state.categories.findIndex((category: Category) => {
        return category.id === action.payload.categoryId;
      });

      state.categories[index].visible = action.payload.visible;
    },
    updateOtherCategoryVisibility(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      for (let category of state.categories) {
        category.visible =
          action.payload.id === undefined
            ? true
            : category.id === action.payload.id;
      }
    },
    updateOtherAnnotationCategoryVisibility(
      state,
      action: PayloadAction<{ id?: string }>
    ) {
      for (let category of state.annotationCategories) {
        category.visible =
          action.payload.id === undefined
            ? true
            : category.id === action.payload.id;
      }
    },
    updateLabeledImagesVisibility(
      state,
      action: PayloadAction<{ visibility: boolean }>
    ) {
      state.images.forEach((image) => {
        if (image.partition !== Partition.Inference) {
          image.visible = action.payload.visibility;
        }
      });
    },
    updateImageCategoryFromHighlighted(
      state,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      action.payload.ids.forEach((imageId) => {
        const index = state.images.findIndex((image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          if (state.highlightedCategory)
            state.images[index].categoryId = state.highlightedCategory;
        }
      });
    },
    updateImageCategory(
      state,
      action: PayloadAction<{ id: string; categoryId: string }>
    ) {
      const index = state.images.findIndex((image) => {
        return image.id === action.payload.id;
      });
      if (index >= 0) {
        state.images[index].categoryId = action.payload.categoryId;
      }
    },
    updateImageCategories(
      state,
      action: PayloadAction<{ ids: Array<string>; categoryId: string }>
    ) {
      action.payload.ids.forEach((imageId) => {
        const index = state.images.findIndex((image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].categoryId = action.payload.categoryId;
          if (action.payload.categoryId === UNKNOWN_CLASS_CATEGORY_ID) {
            //If assigned category is unknown, then this image is moved to inference set, else it is assigned to training set
            state.images[index].partition = Partition.Inference;
          } else {
            state.images[index].partition = Partition.Training;
          }
        }
      });
    },
    updateImagesCategories(
      state,
      action: PayloadAction<{ ids: Array<string>; categoryIds: Array<string> }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = state.images.findIndex((image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].categoryId = action.payload.categoryIds[idx];
        }
      });
    },
    updateImagesPartition(
      state,
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = state.images.findIndex((image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].partition = action.payload.partition;
        }
      });
    },
    updateSegmentationImagesPartition(
      state,
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = state.images.findIndex((image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].segmentationPartition = action.payload.partition;
        }
      });
    },
    updateAnnotationCategory(
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      const index = state.annotationCategories.findIndex(
        (category: Category) => {
          return category.id === action.payload.id;
        }
      );
      state.annotationCategories[index].name = action.payload.name;
      state.annotationCategories[index].color = action.payload.color;
    },
    uploadImages(
      state,
      action: PayloadAction<{ newImages: Array<ImageType> }>
    ) {
      const imageNames = state.images.map((image) => {
        return image.name.split(".")[0];
      });
      const updatedImages = action.payload.newImages.map(
        (image: ImageType, i: number) => {
          const initialName = image.name.split(".")[0]; //get name before file extension
          //add filename extension to updatedName
          const updatedName =
            replaceDuplicateName(initialName, imageNames) +
            "." +
            image.name.split(".").slice(1);
          return { ...image, name: updatedName };
        }
      );

      state.images.push(...updatedImages);
    },
    updateImageAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
        imageId: string;
      }>
    ) {
      state.images = state.images.map((image) => {
        if (action.payload.imageId !== image.id) {
          return image;
        } else {
          return { ...image, annotations: action.payload.annotations };
        }
      });
    },
  },
});

export const {
  createCategory,
  createAnnotationCategory,
  uploadImages,
  createNewProject,
  deleteCategory,
  deleteAnnotationCategory,
  updateCategory,
  updateAnnotationCategory,
  updateCategoryVisibility,
  updateHighlightedCategory,
  setAnnotationCategoryVisibility,
  updateImageCategories,
  updateImageCategory,
  updateImageCategoryFromHighlighted,
  updateOtherCategoryVisibility,
  updateOtherAnnotationCategoryVisibility,
  updateSegmentationImagesPartition,
  setAnnotationCategories,
  updateImageAnnotations,
  clearAnnotations,
} = projectSlice.actions;
