import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "types/Project";
import { defaultImageSortKey, ImageSortKey } from "types/ImageSortType";

export const initialState: Project = {
  selectedImageIds: [],
  name: "Untitled project",
  imageSortKey: defaultImageSortKey.imageSortKey,
  highlightedCategory: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    resetProject: () => initialState,
    clearSelectedImages(state) {
      state.selectedImageIds = [];
    },
    deselectImage(state, action: PayloadAction<{ id: string }>) {
      state.selectedImageIds = state.selectedImageIds.filter(
        (id: string) => id !== action.payload.id
      );
    },
    deselectImages(state, action: PayloadAction<{ ids: Array<string> }>) {
      state.selectedImageIds = state.selectedImageIds.filter(
        (id: string) => !action.payload.ids.includes(id)
      );
    },
    selectAllImages(state, action: PayloadAction<{ ids: Array<string> }>) {
      state.selectedImageIds = [];

      state.selectedImageIds = action.payload.ids;
    },
    selectImage(state, action: PayloadAction<{ imageId: string }>) {
      state.selectedImageIds.push(action.payload.imageId);
    },
    selectImages(state, action: PayloadAction<{ imageIds: Array<string> }>) {
      for (const imageId of action.payload.imageIds) {
        projectSlice.caseReducers.selectImage(state, {
          type: "selectImage",
          payload: { imageId },
        });
      }
    },
    setselectedImages(
      state,
      action: PayloadAction<{ imageIds: Array<string> }>
    ) {
      state.selectedImageIds = [];

      projectSlice.caseReducers.selectImages(state, {
        type: "selectImages",
        payload: { imageIds: action.payload.imageIds },
      });
    },

    createNewProject(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
      state.imageSortKey = defaultImageSortKey.imageSortKey;
    },
    setProject(state, action: PayloadAction<{ project: Project }>) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.project;
      return action.payload.project;
    },
    sortImagesBySelectedKey(
      state,
      action: PayloadAction<{ imageSortKey: ImageSortKey }>
    ) {
      const selectedSortKey = action.payload.imageSortKey;
      state.imageSortKey = selectedSortKey;

      //(state.images as OldImageType[]).sort(selectedSortKey.comparerFunction);
    },
    setProjectName(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
    },
    updateHighlightedCategory(
      state,
      action: PayloadAction<{ categoryIndex: number }>
    ) {
      // const index = action.payload.categoryIndex;
      // if (!isNaN(index) && index < state.categories.length) {
      //   const categoryId = state.categories[action.payload.categoryIndex].id;
      //   state.highlightedCategory = categoryId;
      // } else {
      //   state.highlightedCategory = null;
      // }
    },
  },
});

export const {
  createNewProject,
  selectImage,
  selectImages,
  selectAllImages,
  setselectedImages,
  deselectImage,
  deselectImages,
  updateHighlightedCategory,
} = projectSlice.actions;
