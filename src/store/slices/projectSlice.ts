import { Project } from "../../types/Project";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category } from "../../types/Category";
import { v4 } from "uuid";
import { Image } from "../../types/Image";
import { findIndex, filter } from "underscore";
import { Shape } from "../../types/Shape";

const initialState: Project = {
  categories: [
    {
      color: "#AAAAAA",
      id: "00000000-0000-0000-0000-000000000000",
      name: "Unknown",
      visible: true,
    },
  ],
  images: [],
  name: "Untitled project",
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
    createImage(
      state: Project,
      action: PayloadAction<{ shape: Shape; src: string }>
    ) {
      const image: Image = {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: v4(),
        instances: [],
        name: "",
        shape: action.payload.shape,
        src: action.payload.src,
      };

      state.images.push(image);
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
        }
      });
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
  updateImageCategory,
  updateImageCategories,
  updateOtherCategoryVisibility,
} = projectSlice.actions;
