import { Project } from "types/Project";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CATEGORY,
  UNKNOWN_CATEGORY_ID,
} from "types/Category";
import { v4 as uuidv4 } from "uuid";
import { ImageType, ShadowImageType } from "types/ImageType";
import { filter, findIndex } from "lodash";
import { Task } from "types/Task";
import { Partition } from "types/Partition";
import { defaultImageSortKey, ImageSortKeyType } from "types/ImageSortType";
import { replaceDuplicateName } from "image/imageHelper";
import { defaultImage } from "images/defaultImage";
import { AnnotationType } from "types/AnnotationType";

const initialAnnotationCategories =
  process.env.NODE_ENV === "development"
    ? [
        UNKNOWN_ANNOTATION_CATEGORY,
        {
          color: "#b66dff",
          id: "00000000-0000-0000-0000-000000000001",
          name: "Cell membrane",
          visible: true,
        },
        {
          color: "#6db6ff",
          id: "00000000-0000-0000-0000-000000000002",
          name: "Cell nucleus",
          visible: true,
        },
      ]
    : [UNKNOWN_ANNOTATION_CATEGORY];

const initialState: Project = {
  categories: [UNKNOWN_CATEGORY],
  annotationCategories: initialAnnotationCategories,
  images: [defaultImage],
  name: "Untitled project",
  task: Task.Classify,
  trainFlag: 0,
  imageSortKey: defaultImageSortKey,
  highlightedCategory: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    addImages(
      state: Project,
      action: PayloadAction<{ images: Array<ImageType> }>
    ) {
      state.images = state.images.concat(action.payload.images);
    },
    clearAnnotations(
      state: Project,
      action: PayloadAction<{ category: Category }>
    ) {
      for (let image of state.images) {
        image.annotations = image.annotations.filter(
          (annotation: AnnotationType) => {
            return annotation.categoryId !== action.payload.category.id;
          }
        );
      }
    },
    clearPredictions(state: Project, action: PayloadAction<{}>) {
      state.images.forEach((image: ImageType) => {
        if (image.partition === Partition.Inference) {
          image.categoryId = UNKNOWN_CATEGORY_ID;
        }
      });
    },
    createAnnotationCategory(
      state: Project,
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
      state: Project,
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
    createNewProject(state: Project, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
      state.categories = [UNKNOWN_CATEGORY];
      state.annotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];
      state.images = [];
      state.task = Task.Classify;
      state.trainFlag = 0;
      state.imageSortKey = defaultImageSortKey;
    },
    deleteAllAnnotationCategories(state: Project, action: PayloadAction<{}>) {
      state.annotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];

      state.images = state.images.map((image: ImageType) => {
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
    deleteAllCategories(state: Project, action: PayloadAction<{}>) {
      state.categories = [UNKNOWN_CATEGORY];

      state.images = state.images.map((image: ImageType) => {
        image.categoryId = UNKNOWN_CATEGORY_ID;
        image.partition = Partition.Inference;
        return image;
      });
    },
    deleteAnnotationCategory(
      state: Project,
      action: PayloadAction<{ categoryID: string }>
    ) {
      state.annotationCategories = state.annotationCategories.filter(
        (category: Category) => category.id !== action.payload.categoryID
      );

      state.images = state.images.map((image: ImageType) => {
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

    deleteCategory(state: Project, action: PayloadAction<{ id: string }>) {
      state.categories = filter(state.categories, (category: Category) => {
        return category.id !== action.payload.id;
      });
      state.images = state.images.map((image: ImageType) => {
        if (image.categoryId === action.payload.id) {
          image.categoryId = UNKNOWN_CATEGORY_ID;
          image.partition = Partition.Inference;
        }
        return image;
      });
    },

    deleteImages(
      state: Project,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      state.images = filter(state.images, (image: ImageType) => {
        return !action.payload.ids.includes(image.id);
      });
    },
    openProject(
      state: Project,
      action: PayloadAction<{
        images: Array<ImageType>;
        name: string;
        categories: Array<Category>;
        annotationCategories: Array<Category>;
      }>
    ) {
      state.categories = action.payload.categories;
      state.annotationCategories = action.payload.annotationCategories;
      state.name = action.payload.name;
      state.images = action.payload.images;
    },
    reconcileImages(
      state: Project,
      action: PayloadAction<{
        images: Array<ShadowImageType>;
      }>
    ) {
      action.payload.images.forEach((shadowImage: ShadowImageType) => {
        const projectImageIdx = state.images.findIndex((image: ImageType) => {
          return shadowImage.id === image.id;
        });

        if (projectImageIdx >= 0) {
          const projectImage = state.images[projectImageIdx];

          state.images[projectImageIdx] = {
            ...projectImage,
            ...shadowImage,
          };
        }
      });
    },
    setAnnotationCategories(
      state: Project,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.annotationCategories = action.payload.categories;
    },
    setAnnotationCategoryVisibility(
      state: Project,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      const index = findIndex(
        state.annotationCategories,
        (category: Category) => {
          return category.id === action.payload.categoryId;
        }
      );
      state.annotationCategories[index].visible = action.payload.visible;
    },
    setCategories(
      state: Project,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = [...state.categories, ...action.payload.categories];
    },
    setImages(
      state: Project,
      action: PayloadAction<{ images: Array<ImageType> }>
    ) {
      state.images = action.payload.images;
    },
    sortImagesBySelectedKey(
      state: Project,
      action: PayloadAction<{ imageSortKey: ImageSortKeyType }>
    ) {
      const selectedSortKey = action.payload.imageSortKey;
      state.imageSortKey = selectedSortKey;

      state.images.sort(selectedSortKey.comparerFunction);
    },

    setProjectName(state: Project, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
    },
    updateCategory(
      state: Project,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      const index = findIndex(state.categories, (category: Category) => {
        return category.id === action.payload.id;
      });
      state.categories[index].name = action.payload.name;
      state.categories[index].color = action.payload.color;
    },
    updateHighlightedCategory(
      state: Project,
      action: PayloadAction<{ categoryIndex: number }>
    ) {
      console.log(action.payload.categoryIndex);
      const index = action.payload.categoryIndex;
      if (!isNaN(index) && index < state.categories.length) {
        const categoryId = state.categories[action.payload.categoryIndex].id;
        state.highlightedCategory = categoryId;
      } else {
        state.highlightedCategory = null;
      }
    },
    updateCategoryVisibility(
      state: Project,
      action: PayloadAction<{ categoryId: string; visible: boolean }>
    ) {
      const index = findIndex(state.categories, (category: Category) => {
        return category.id === action.payload.categoryId;
      });

      state.categories[index].visible = action.payload.visible;
    },
    updateOtherCategoryVisibility(
      state: Project,
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
      state: Project,
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
      state: Project,
      action: PayloadAction<{ visibility: boolean }>
    ) {
      state.images.forEach((image: ImageType) => {
        if (image.partition !== Partition.Inference) {
          image.visible = action.payload.visibility;
        }
      });
    },
    updateImageCategoryFromHighlighted(
      state: Project,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      action.payload.ids.forEach((imageId) => {
        const index = findIndex(state.images, (image: ImageType) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          if (state.highlightedCategory)
            state.images[index].categoryId = state.highlightedCategory;
        }
      });
    },
    updateImageCategory(
      state: Project,
      action: PayloadAction<{ id: string; categoryId: string }>
    ) {
      const index = findIndex(state.images, (image: ImageType) => {
        return image.id === action.payload.id;
      });
      if (index >= 0) {
        state.images[index].categoryId = action.payload.categoryId;
      }
    },
    updateImageCategories(
      state: Project,
      action: PayloadAction<{ ids: Array<string>; categoryId: string }>
    ) {
      action.payload.ids.forEach((imageId) => {
        const index = findIndex(state.images, (image: ImageType) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].categoryId = action.payload.categoryId;
          if (action.payload.categoryId === UNKNOWN_CATEGORY_ID) {
            //If assigned category is unknown, then this image is moved to inference set, else it is assigned to training set
            state.images[index].partition = Partition.Inference;
          } else {
            state.images[index].partition = Partition.Training;
          }
        }
      });
    },
    updateImagesCategories(
      state: Project,
      action: PayloadAction<{ ids: Array<string>; categoryIds: Array<string> }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = findIndex(state.images, (image: ImageType) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].categoryId = action.payload.categoryIds[idx];
        }
      });
    },
    updateImagesPartition(
      state: Project,
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = findIndex(state.images, (image: ImageType) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].partition = action.payload.partition;
        }
      });
    },
    updateSegmentationImagesPartition(
      state: Project,
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = findIndex(state.images, (image: ImageType) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].segmentationPartition = action.payload.partition;
        }
      });
    },
    updateTask(state: Project, action: PayloadAction<{ task: Task }>) {
      state.task = action.payload.task;
    },
    updateTrainFlag(
      state: Project,
      action: PayloadAction<{ trainFlag: number }>
    ) {
      state.trainFlag = action.payload.trainFlag;
    },

    updateAnnotationCategory(
      state: Project,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      const index = findIndex(
        state.annotationCategories,
        (category: Category) => {
          return category.id === action.payload.id;
        }
      );
      state.annotationCategories[index].name = action.payload.name;
      state.annotationCategories[index].color = action.payload.color;
    },

    uploadImages(
      state: Project,
      action: PayloadAction<{ newImages: Array<ImageType> }>
    ) {
      const imageNames = state.images.map((image: ShadowImageType) => {
        return image.name.split(".")[0];
      });

      const updatedImages = action.payload.newImages.map(
        (image: ImageType, i: number) => {
          const initialName = image.name.split(".")[0]; //get name before file extension
          //add filename extension to updatedName
          const updatedName =
            replaceDuplicateName(initialName, imageNames) +
            "." +
            image.name.split(".")[1];
          return { ...image, name: updatedName };
        }
      );

      state.images.push(...updatedImages);
    },
    updateImageAnnotations(
      state: Project,
      action: PayloadAction<{
        annotations: Array<AnnotationType>;
        imageId: string;
      }>
    ) {
      state.images = state.images.map((image: ImageType) => {
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
