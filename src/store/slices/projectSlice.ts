import { Project } from "../../types/Project";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { v4 as uuidv4 } from "uuid";
import { ImageType, ShadowImageType } from "../../types/ImageType";
import { filter, findIndex } from "lodash";
import { Task } from "../../types/Task";
import { Partition } from "../../types/Partition";
import { defaultImageSortKey, ImageSortKeyType } from "types/ImageSortType";
import { replaceDuplicateName } from "../../image/imageHelper";
import { defaultImage } from "images/defaultImage";

const initialState: Project = {
  categories: [
    {
      color: "#AAAAAA",
      id: UNKNOWN_CATEGORY_ID,
      name: "Unknown",
      visible: true,
    },
  ],
  images: [defaultImage],
  name: "Untitled project",
  task: Task.Classify,
  trainFlag: 0,
  imageSortKey: defaultImageSortKey,
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
    createImage(state: Project, action: PayloadAction<{ image: ImageType }>) {
      const currentImageNames = state.images.map((image: ImageType) => {
        return image.name.split(".")[0];
      });

      const initialName = action.payload.image.name.split(".")[0];
      const updatedName =
        replaceDuplicateName(initialName, currentImageNames) +
        "." +
        action.payload.image.name.split(".")[1];

      const newImage = { ...action.payload.image, name: updatedName };

      state.images.push(newImage);
    },
    createNewProject(state: Project, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
      state.categories = [
        {
          color: "#AAAAAA",
          id: UNKNOWN_CATEGORY_ID,
          name: "Unknown",
          visible: true,
        },
      ];
      state.images = [];
      state.task = Task.Classify;
      state.trainFlag = 0;
      state.imageSortKey = defaultImageSortKey;
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
      }>
    ) {
      state.categories = action.payload.categories;
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
    updateCategoryVisibility(
      state: Project,
      action: PayloadAction<{ id: string; visible: boolean }>
    ) {
      const index = findIndex(state.categories, (category: Category) => {
        return category.id === action.payload.id;
      });
      state.categories[index].visible = action.payload.visible;
    },
    updateOtherCategoryVisibility(
      state: Project,
      action: PayloadAction<{ id: string }>
    ) {
      const categories = filter(state.categories, (category: Category) => {
        return category.id !== action.payload.id;
      });
      for (let category of categories) {
        category.visible = false;
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
    clearPredictions(state: Project, action: PayloadAction<{}>) {
      state.images.forEach((image: ImageType) => {
        if (image.partition === Partition.Inference) {
          image.categoryId = UNKNOWN_CATEGORY_ID;
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
    updateTask(state: Project, action: PayloadAction<{ task: Task }>) {
      state.task = action.payload.task;
    },
    updateTrainFlag(
      state: Project,
      action: PayloadAction<{ trainFlag: number }>
    ) {
      state.trainFlag = action.payload.trainFlag;
    },
    sortImagesBySelectedKey(
      state: Project,
      action: PayloadAction<{ imageSortKey: ImageSortKeyType }>
    ) {
      const selectedSortKey = action.payload.imageSortKey;
      state.imageSortKey = selectedSortKey;

      state.images.sort(selectedSortKey.comparerFunction);
    },
  },
});

export const {
  createCategory,
  createImage,
  createNewProject,
  deleteCategory,
  updateCategory,
  updateCategoryVisibility,
  updateImageCategories,
  updateImageCategory,
  updateOtherCategoryVisibility,
} = projectSlice.actions;
