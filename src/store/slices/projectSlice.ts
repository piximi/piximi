import { Project } from "../../types/Project";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category } from "../../types/Category";
import { v4 } from "uuid";
import { Image } from "../../types/Image";
import { filter, findIndex } from "underscore";
import nuclei from "../../images/317832f90f02c5e916b2ac0f3bcb8da9928d8e400b747b2c68e544e56adacf6b.png";
import { SerializedImageType } from "../../types/SerializedImageType";
import { Task } from "../../types/Task";
import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";

const dummyImage: Image = {
  id: "a860a94c-58aa-44eb-88e7-9538cb48be29",
  categoryId: "00000000-0000-0000-0000-000000000000",
  annotations: [],
  name: "nuclei",
  originalSrc: nuclei,
  src: nuclei,
  shape: {
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
    frames: 1,
  },
  partition: 2,
};

const initialState: Project = {
  categories: [
    {
      color: "#AAAAAA",
      id: "00000000-0000-0000-0000-000000000000",
      name: "Unknown",
      visible: true,
    },
  ],
  images: [dummyImage],
  name: "Untitled project",
  task: Task.Classify,
  trainFlag: 0,
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    createCategory(
      state: Project,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      const category: Category = {
        color: action.payload.color,
        id: v4().toString(),
        name: action.payload.name,
        visible: true,
      };
      state.categories.push(category);
    },
    createImage(state: Project, action: PayloadAction<{ image: Image }>) {
      state.images.push(action.payload.image);
    },
    createProject(state: Project, action: PayloadAction<{ project: Project }>) {
      state.categories = action.payload.project.categories;
      state.name = action.payload.project.name;
      state.images = action.payload.project.images;
    },
    deleteCategory(state: Project, action: PayloadAction<{ id: string }>) {
      state.categories = filter(state.categories, (category: Category) => {
        return category.id !== action.payload.id;
      });
      state.images = state.images.map((image: Image) => {
        if (image.categoryId === action.payload.id) {
          image.categoryId = "00000000-0000-0000-0000-000000000000";
        }
        return image;
      });
    },
    deleteImages(
      state: Project,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      state.images = filter(state.images, (image: Image) => {
        return !action.payload.ids.includes(image.id);
      });
    },
    openImages(
      state: Project,
      action: PayloadAction<{ images: Array<SerializedImageType> }>
    ) {
      const newImages: Array<Image> = [];

      action.payload.images.forEach((serializedImage: SerializedImageType) => {
        const image: Image = {
          categoryId: serializedImage.imageCategoryId,
          id: serializedImage.imageId,
          annotations: [], //TODO implement this once we have imported the Annotation Type from Annotator into Piximi classifier
          name: serializedImage.imageFilename,
          partition: serializedImage.imagePartition,
          shape: {
            width: serializedImage.imageWidth,
            height: serializedImage.imageHeight,
            channels: serializedImage.imageChannels,
            planes: serializedImage.imagePlanes,
            frames: serializedImage.imageFrames,
          },
          originalSrc: serializedImage.imageData,
          src: serializedImage.imageData,
        };

        newImages.push(image);
      });

      state.images = newImages;
    },
    openProject(
      state: Project,
      action: PayloadAction<{
        images: Array<SerializedImageType>;
        name: string;
        categories: Array<Category>;
      }>
    ) {
      state.categories = action.payload.categories;
      state.name = action.payload.name;

      //Open images
      const newImages: Array<Image> = [];

      action.payload.images.forEach((serializedImage: SerializedImageType) => {
        const image: Image = {
          categoryId: serializedImage.imageCategoryId,
          id: serializedImage.imageId,
          annotations: [], //TODO implement this once we have imported the Annotation Type from Annotator into Piximi classifier
          name: serializedImage.imageFilename,
          partition: serializedImage.imagePartition,
          shape: {
            width: serializedImage.imageWidth,
            height: serializedImage.imageHeight,
            channels: serializedImage.imageChannels,
            planes: serializedImage.imagePlanes,
            frames: serializedImage.imageFrames,
          },
          originalSrc: serializedImage.imageData,
          src: serializedImage.imageData,
        };

        newImages.push(image);
      });

      state.images = newImages;
    },
    setCategories(
      state: Project,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = action.payload.categories;
    },
    setImages(state: Project, action: PayloadAction<{ images: Array<Image> }>) {
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
    updateImageCategory(
      state: Project,
      action: PayloadAction<{ id: string; categoryId: string }>
    ) {
      const index = findIndex(state.images, (image: Image) => {
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
        const index = findIndex(state.images, (image: Image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].categoryId = action.payload.categoryId;
          if (
            action.payload.categoryId === "00000000-0000-0000-0000-000000000000"
          ) {
            //If assigned category is unknown, then this image is moved to test set
            state.images[index].partition = 2;
          }
        }
      });
    },
    updateImagesCategories(
      state: Project,
      action: PayloadAction<{ ids: Array<string>; categoryIds: Array<string> }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = findIndex(state.images, (image: Image) => {
          return image.id === imageId;
        });
        if (index >= 0) {
          state.images[index].categoryId = action.payload.categoryIds[idx];
        }
      });
    },
    updateImagesPartition(
      state: Project,
      action: PayloadAction<{ ids: Array<string>; partition: number }>
    ) {
      action.payload.ids.forEach((imageId, idx) => {
        const index = findIndex(state.images, (image: Image) => {
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
  },
});

export const {
  createCategory,
  createImage,
  createProject,
  deleteCategory,
  updateCategory,
  updateCategoryVisibility,
  updateImageCategories,
  updateImageCategory,
  updateOtherCategoryVisibility,
} = projectSlice.actions;
