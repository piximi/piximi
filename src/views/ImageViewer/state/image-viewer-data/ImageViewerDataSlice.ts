import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "store/data/constants";

import { ImageViewerDataState, ImageViewerMetadataDetails } from "./types";
import { mutatingFilter } from "utils/arrayUtils";
import { PendingTracklet } from "store/data/types";

const initialState: ImageViewerDataState = {
  metadataStack: {},
  imageIsLoading: true,
  activeMetdataId: undefined,
  activeAnnotationIds: [],

  selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,

  highlightedCategory: undefined,
  hasUnsavedChanges: false,
  selectedAnnotationIds: [],
  trackingUI: {
    showTracklets: false,
    selectedTracklets: [],
  },
  tLinking: { active: false, trackId: undefined },
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
    setMetadataStack(
      state,
      action: PayloadAction<Record<string, ImageViewerMetadataDetails>>,
    ) {
      state.metadataStack = action.payload;
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
    setActiveMetadataId(
      state,
      action: PayloadAction<{
        metadataId: string | undefined;
        prevMetadataId: string | undefined;
      }>,
    ) {
      state.activeMetdataId = action.payload.metadataId;
      // reset selected annotations
    },

    setActiveMetadataRenderedSrcs(state, action: PayloadAction<Array<string>>) {
      const activeMetadataId = state.activeMetdataId;
      if (!activeMetadataId)
        throw new Error("Set rendered sources failed: No active image");

      state.metadataStack[activeMetadataId].activeSrcs = action.payload;
    },
    setActiveTZPreviews(state, action: PayloadAction<Record<string, string>>) {
      const activeImageId = state.activeMetdataId;
      const previews = action.payload;
      if (!activeImageId)
        throw new Error("Set rendered sources failed: No active image");

      const activeImageDetails = state.metadataStack[activeImageId];
      Object.entries(previews).forEach(([tp, src]) => {
        activeImageDetails.images[tp].ZTPreview = src;
      });
    },

    setActiveImage(state, action: PayloadAction<string>) {
      const newActiveImageId = action.payload;
      const activeMetadataId = state.activeMetdataId;
      if (!activeMetadataId)
        throw new Error("Set rendered sources failed: No active image");
      const activeMetadata = state.metadataStack[activeMetadataId];
      const newActiveImageSrc = activeMetadata.images[action.payload].ZTPreview;
      activeMetadata.activeImageId = newActiveImageId;
      activeMetadata.activeSrcs = [newActiveImageSrc];
    },
    setActiveImageCategory(state, action: PayloadAction<string>) {
      if (!state.activeMetdataId) {
        console.error("No active metadata id");
        return;
      }
      const metadata = state.metadataStack[state.activeMetdataId];
      const activeImageId = metadata.activeImageId;
      metadata.images[activeImageId].categoryId = action.payload;
    },

    updateHighlightedAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },
    setActiveMetadataActivePlane(state, action: PayloadAction<number>) {
      const activeMetadataId = state.activeMetdataId;
      if (!activeMetadataId)
        throw new Error("Set rendered sources failed: No active image");

      const activeImageDetails = state.metadataStack[activeMetadataId];
      activeImageDetails.activePlane = action.payload;
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
    startNewTrack(state, action: PayloadAction<PendingTracklet>) {
      state.tLinking = {
        active: true,
        trackId: action.payload.trackId,
        pendingTracklet: action.payload,
      };
    },
    toggleTimeLinking(state, action: PayloadAction<boolean>) {
      const active = action.payload;
      state.tLinking.active = active;
      state.tLinking.trackId = undefined;
    },
    toggleZLinking(state, action: PayloadAction<boolean>) {
      state.zLinking.active = action.payload;
    },
    removeActiveTrack(state) {
      const trackId = state.tLinking.trackId;
      if (!trackId) return;
      Object.assign(state.tLinking, { active: false, trackId: undefined });
    },

    setTLinkingTrackId(state, action: PayloadAction<string>) {
      state.tLinking.trackId = action.payload;
      state.tLinking.active = true;
    },
    setShowTracklets: (state, action: PayloadAction<boolean>) => {
      state.trackingUI.showTracklets = action.payload;
    },

    setSelectedTracklets: (state, action: PayloadAction<string[]>) => {
      state.trackingUI.selectedTracklets = action.payload;
    },
    selectTracklet: (state, action: PayloadAction<string>) => {
      const { selectedTracklets: selectedTracklets } = state.trackingUI;
      if (!selectedTracklets.includes(action.payload)) {
        selectedTracklets.push(action.payload);
      }
    },

    deselectTracklet: (state, action: PayloadAction<string>) => {
      const { selectedTracklets } = state.trackingUI;
      mutatingFilter(selectedTracklets, (id) => id !== action.payload);
    },

    toggleSelectedTrack: (state, action: PayloadAction<string>) => {
      const { selectedTracklets } = state.trackingUI;
      const index = selectedTracklets.indexOf(action.payload);
      if (index !== -1) {
        mutatingFilter(selectedTracklets, (id) => id !== action.payload);
      } else {
        selectedTracklets.push(action.payload);
      }
    },

    clearTrackSelection: (state) => {
      state.trackingUI.selectedTracklets = [];
    },

    resetTrackingUI: (state) => {
      state.trackingUI = {
        showTracklets: false,
        selectedTracklets: [],
      };
    },
  },
});
