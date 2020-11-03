import { createReducer, PayloadAction } from "@reduxjs/toolkit";
import {
  createProjectCategoryAction,
  createProjectImageAction,
  createProjectAction,
  updateCategoryAction,
  updateImageCategoryAction,
} from "../actions";
import { v4 } from "uuid";
import { findIndex } from "underscore";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

const initialState: Project = {
  categories: [
    {
      color: "rgb(255, 255, 0)",
      id: "00000000-0000-0000-0000-000000000000",
      name: "Unknown",
    },
  ],
  images: [],
  name: "Untitled project",
};

export const projectReducer = createReducer(initialState, {
  [createProjectCategoryAction.type]: (
    state: Project,
    action: PayloadAction<{ name: string; color: string }>
  ) => {
    const category: Category = {
      color: action.payload.color,
      id: v4().toString(),
      name: action.payload.name,
    };

    state.categories.push(category);
  },
  [createProjectImageAction.type]: (
    state: Project,
    action: PayloadAction<{ src: string }>
  ) => {
    const image: Image = {
      id: v4(),
      name: "",
      src: action.payload.src,
      categoryId: "00000000-0000-0000-0000-000000000000",
    };

    state.images.push(image);
  },
  [createProjectAction.type]: (
    state: Project,
    action: PayloadAction<{ project: Project }>
  ) => {
    state.categories = action.payload.project.categories;
    state.name = action.payload.project.name;
    state.images = action.payload.project.images;
  },
  [updateCategoryAction.type]: (
    state: Project,
    action: PayloadAction<{ id: string; name: string; color: string }>
  ) => {
    const index = findIndex(state.categories, (category: Category) => {
      return category.id === action.payload.id;
    });
    state.categories[index].name = action.payload.name;
    state.categories[index].color = action.payload.color;
  },
  [updateImageCategoryAction.type]: (
    state: Project,
    action: PayloadAction<{ id: string; categoryId: string }>
  ) => {
    const index = findIndex(state.images, (image: Image) => {
      return image.id === action.payload.id;
    });

    if (index >= 0) {
      state.images[index].categoryId = action.payload.categoryId;
    }
  },
});
