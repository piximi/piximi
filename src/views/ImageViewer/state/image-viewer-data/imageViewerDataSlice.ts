import { createSlice } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "store/data/constants";

import type { PayloadAction } from "@reduxjs/toolkit";
import type { ImageViewerDataState } from "../types";

const initialState: ImageViewerDataState = {
  imageStack: [],
  imageIsLoading: true,
  activeImageId: undefined,
  activeAnnotationIds: [],
  selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
  highlightedCategory: undefined,
  hasUnsavedChanges: false,
  selectedAnnotationIds: [],
  zLinking: { active: false, annIds: {} },
};

export const imageViewerDataSlice = createSlice({
  name: "imageViewerData",
  initialState,
  reducers: {
    resetState() {
      return initialState;
    },
    setImageIsLoading(state, action: PayloadAction<{ isLoading: boolean }>) {
      state.imageIsLoading = action.payload.isLoading;
    },
    setImageStack(state, action: PayloadAction<Array<string>>) {
      state.imageStack = action.payload;
    },
    setHasUnsavedChanges(state, action: PayloadAction<boolean>) {
      state.hasUnsavedChanges = action.payload;
    },

    addActiveAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      state.activeAnnotationIds.push(...ids);
    },
    setActiveAnnotationIds(state, action: PayloadAction<Array<string>>) {
      state.activeAnnotationIds = action.payload;
    },

    removeActiveAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.activeAnnotationIds = difference(state.activeAnnotationIds, ids);
    },
    setSelectedCategoryId(state, action: PayloadAction<string>) {
      state.selectedCategoryId = action.payload;
    },
    setActiveImageId(state, action: PayloadAction<string | undefined>) {
      state.activeImageId = action.payload;
      // reset selected annotations
    },

    updateHighlightedAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },

    addSelectedAnnotationId(state, action: PayloadAction<string>) {
      state.selectedAnnotationIds.push(action.payload);
    },
    addSelectedAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.selectedAnnotationIds.push(...ids);
    },
    setSelectedAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.selectedAnnotationIds = ids;
    },

    removeSelectedAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.selectedAnnotationIds = difference(
        state.selectedAnnotationIds,
        ids,
      );
    },

    toggleZLinking(state, action: PayloadAction<boolean>) {
      state.zLinking.active = action.payload;
    },
  },
});
