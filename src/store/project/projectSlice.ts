import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "types/Project";
import { defaultImageSortKey, ImageSortKey } from "types/ImageSortType";
import { mutatingFilter } from "utils/common/helpers";
import { ImageGridTab } from "types";

export const initialState: Project = {
  selectedImageIds: [],
  name: "Untitled project",
  imageSortKey: defaultImageSortKey.imageSortKey,
  highlightedCategory: undefined,
  hiddenImageCategoryIds: [],
  selectedAnnotationIds: [],
  imageGridTab: "Images",
  loadPercent: 1,
  loadMessage: "",
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    resetProject: () => initialState,

    createNewProject(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
      state.imageSortKey = defaultImageSortKey.imageSortKey;
    },
    setProject(state, action: PayloadAction<{ project: Project }>) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.project;
      return action.payload.project;
    },
    setImageGridTab(state, action: PayloadAction<{ view: ImageGridTab }>) {
      state.imageGridTab = action.payload.view;
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
    clearSelectedImages(state) {
      state.selectedImageIds = [];
    },
    setSelectedImages(
      state,
      action: PayloadAction<{ imageIds: Array<string> }>
    ) {
      state.selectedImageIds = [];

      projectSlice.caseReducers.selectImages(state, {
        type: "selectImages",
        payload: { imageIds: action.payload.imageIds },
      });
    },
    selectAnnotation(state, action: PayloadAction<{ annotationId: string }>) {
      state.selectedAnnotationIds.push(action.payload.annotationId);
    },
    selectAnnotations(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        projectSlice.caseReducers.selectAnnotation(state, {
          type: "selectAnnotation",
          payload: { annotationId },
        });
      }
    },

    deselectAnnotation(state, action: PayloadAction<{ annotationId: string }>) {
      state.selectedAnnotationIds = state.selectedAnnotationIds.filter(
        (id: string) => id !== action.payload.annotationId
      );
    },
    deselectAnnotations(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      state.selectedAnnotationIds = state.selectedAnnotationIds.filter(
        (id: string) => !action.payload.annotationIds.includes(id)
      );
    },
    clearSelectedAnnotations(state) {
      state.selectedAnnotationIds = [];
    },
    setSelectedAnnotations(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      state.selectedAnnotationIds = [];

      projectSlice.caseReducers.selectAnnotations(state, {
        type: "selectAnnotations",
        payload: { annotationIds: action.payload.annotationIds },
      });
    },
    hideCategory(
      state,
      action: PayloadAction<{
        categoryId: string;
      }>
    ) {
      !state.hiddenImageCategoryIds.includes(action.payload.categoryId) &&
        state.hiddenImageCategoryIds.push(action.payload.categoryId);
    },
    hideCategories(
      state,
      action: PayloadAction<{
        categoryIds: string[];
      }>
    ) {
      for (const categoryId of action.payload.categoryIds) {
        projectSlice.caseReducers.hideCategory(state, {
          type: "hideCategory",
          payload: { categoryId },
        });
      }
    },
    showCategory(
      state,
      action: PayloadAction<{
        categoryId: string;
      }>
    ) {
      mutatingFilter(
        state.hiddenImageCategoryIds,
        (categoryId) => categoryId !== action.payload.categoryId
      );
    },
    showCategories(
      state,
      action: PayloadAction<{
        categoryIds?: string[];
      }>
    ) {
      if (!action.payload.categoryIds) {
        state.hiddenImageCategoryIds = [];
        return;
      }
      for (const categoryId of action.payload.categoryIds) {
        projectSlice.caseReducers.showCategory(state, {
          type: "showCategory",
          payload: { categoryId },
        });
      }
    },
    toggleCategoryVisibility(
      state,
      action: PayloadAction<{
        categoryId: string;
      }>
    ) {
      const { categoryId } = action.payload;

      if (state.hiddenImageCategoryIds.includes(categoryId)) {
        mutatingFilter(
          state.hiddenImageCategoryIds,
          (id) => id !== action.payload.categoryId
        );
      } else {
        state.hiddenImageCategoryIds.push(categoryId);
      }
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
    setLoadPercent(
      state,
      action: PayloadAction<{ loadPercent?: number; loadMessage?: string }>
    ) {
      const { loadPercent, loadMessage } = action.payload;

      if (!loadPercent) {
        state.loadPercent = 1; // not / done loading
        state.loadMessage = "";
      } else if (loadPercent < 0) {
        state.loadPercent = -1; // indefinite loading
        state.loadMessage = loadMessage ?? "Loading...";
      } else if (loadPercent >= 1) {
        state.loadPercent = 1; // default to not loading if invalid
        state.loadMessage = "";
      } else {
        state.loadPercent = loadPercent; // loading [0, 1]
        state.loadMessage = loadMessage ?? "";
      }
    },
    sendLoadPercent(
      state,
      action: PayloadAction<{ loadPercent?: number; loadMessage?: string }>
    ) {},
    setLoadMessage(state, action: PayloadAction<{ message: string }>) {
      state.loadMessage = action.payload.message;
    },
    updateHighlightedImageCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },
  },
});

export const {
  createNewProject,
  selectImage,
  selectImages,
  selectAllImages,
  setSelectedImages,
  deselectImage,
  deselectImages,
  updateHighlightedImageCategory,
  setLoadPercent,
} = projectSlice.actions;
