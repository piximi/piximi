import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImageViewerDataState, ImageViewerMetadataDetails } from "./types";
import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "store/data/constants";
import { difference } from "lodash";

const initialState: ImageViewerDataState = {
  metadataStack: {},
  imageIsLoading: true,
  activeMetdataId: undefined,
  activeAnnotationIds: [],

  selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,

  highlightedCategory: undefined,
  hasUnsavedChanges: false,
  selectedAnnotationIds: [],
  tLinking: { active: false, trackId: undefined, tracks: {} },
  zLinking: { active: false, annIds: {} },
  linkGraph: {},
  globalAnnotations: {},
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
    startNewTrack(state, action: PayloadAction<string>) {
      state.tLinking.active = true;
      state.tLinking.trackId = action.payload;
      state.tLinking.tracks[action.payload] = {};
    },
    toggleTimeLinking(state, action: PayloadAction<boolean>) {
      const active = action.payload;
      state.tLinking.active = active;
      state.tLinking.trackId = undefined;
    },
    toggleZLinking(state, action: PayloadAction<boolean>) {
      state.zLinking.active = action.payload;
    },
    addTLinkedAnnotation(state, action: PayloadAction<string>) {
      const annId = action.payload;
      const activeTrack = state.tLinking.trackId!;
      const activeImageId =
        state.metadataStack[state.activeMetdataId!].activeImageId!;
      state.tLinking.tracks[activeTrack][activeImageId] = annId;
    },
    removeActiveTLinkedFrame(state) {
      const activeImageId =
        state.metadataStack[state.activeMetdataId!].activeImageId!;
      const activeTrack = state.tLinking.trackId!;
      delete state.tLinking.tracks[activeTrack][activeImageId];
    },
    removeActiveTrack(state) {
      const trackId = state.tLinking.trackId;
      if (!trackId) return;
      Object.assign(state.tLinking, { active: false, trackId: undefined });

      delete state.tLinking.tracks[trackId];
    },
    toggleTLinkedAnnotation(
      state,
      action: PayloadAction<{ annId: string; imId: string }>,
    ) {
      const { annId, imId } = action.payload;
      const activeTrack = state.tLinking.trackId!;
      const linkedId = state.tLinking.tracks[activeTrack][imId];
      if (linkedId === annId) delete state.tLinking.tracks[activeTrack][imId];
      else state.tLinking.tracks[activeTrack][imId] = annId;
    },

    setTLinkingTrackId(state, action: PayloadAction<string>) {
      state.tLinking.trackId = action.payload;
      state.tLinking.active = true;
    },
  },
});
