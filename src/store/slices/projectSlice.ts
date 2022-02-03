import { Project } from "../../types/Project";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { v4 as uuidv4 } from "uuid";
import { Image } from "../../types/Image";
import { filter, findIndex } from "lodash";
import nuclei from "../../images/317832f90f02c5e916b2ac0f3bcb8da9928d8e400b747b2c68e544e56adacf6b.png";
import { Task } from "../../types/Task";
import { Partition } from "../../types/Partition";

const dummyImage: Image = {
  id: "a860a94c-58aa-44eb-88e7-9538cb48be29",
  categoryId: UNKNOWN_CATEGORY_ID,
  annotations: [],
  name: "nuclei",
  originalSrc: [nuclei],
  src: nuclei,
  shape: {
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
    frames: 1,
  },
  partition: Partition.Inference,
};

const initialState: Project = {
  categories: [
    {
      color: "#AAAAAA",
      id: UNKNOWN_CATEGORY_ID,
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
        id: uuidv4().toString(),
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
          image.categoryId = UNKNOWN_CATEGORY_ID;
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
    openProject(
      state: Project,
      action: PayloadAction<{
        images: Array<Image>;
        name: string;
        categories: Array<Category>;
      }>
    ) {
      state.categories = action.payload.categories;
      state.name = action.payload.name;
      state.images = action.payload.images;
    },
    setCategories(
      state: Project,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = [...state.categories, ...action.payload.categories];
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
      action: PayloadAction<{ ids: Array<string>; partition: Partition }>
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
