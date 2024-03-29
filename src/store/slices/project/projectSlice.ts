import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "types/Project";
import { defaultImageSortKey, ImageSortKey } from "types/ImageSortType";
import { distinctFilter, mutatingFilter } from "utils/common/helpers";
import { ImageGridTab, Partition } from "types";

export const initialState: Project = {
  selectedImageIds: [],
  name: "Untitled project",
  imageSortKey: defaultImageSortKey.imageSortKey,
  highlightedCategory: undefined,
  selectedAnnotationIds: [],
  imageGridTab: "Images",
  loadPercent: 1,
  loadMessage: "",
  imageFilters: { categoryId: [], partition: [] },
  annotationFilters: { categoryId: [] },
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
    selectImages(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      for (const imageId of ids) {
        state.selectedImageIds.push(imageId);
      }
    },
    deselectImages(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      state.selectedImageIds = state.selectedImageIds.filter(
        (id: string) => !ids.includes(id)
      );
    },
    setSelectedImages(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      state.selectedImageIds =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
    },
    selectAnnotations(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      for (const annotationId of ids) {
        if (!state.selectedAnnotationIds.includes(annotationId)) {
          state.selectedAnnotationIds.push(annotationId);
        }
      }
    },
    deselectAnnotations(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      state.selectedAnnotationIds = state.selectedAnnotationIds.filter(
        (id: string) => !ids.includes(id)
      );
    },
    setSelectedAnnotations(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      state.selectedAnnotationIds =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
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
    addImageCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[];
      }>
    ) {
      const newFilters = [
        ...state.imageFilters["categoryId"],
        ...action.payload.categoryIds,
      ].filter(distinctFilter);
      state.imageFilters["categoryId"] = newFilters;
    },
    removeImageCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds?: string[];
        all?: boolean;
      }>
    ) {
      if (action.payload.all) {
        state.imageFilters["categoryId"] = [];
        return;
      }
      if (action.payload.categoryIds) {
        mutatingFilter(
          state.imageFilters["categoryId"],
          (id) => !action.payload.categoryIds!.includes(id)
        );
      }
    },
    setImagePartitionFilters(
      state,
      action: PayloadAction<{
        partitions: Partition[];
      }>
    ) {
      state.imageFilters["partition"] = action.payload.partitions;
    },
    addImagePartitionFilters(
      state,
      action: PayloadAction<{
        partitions: Partition[];
      }>
    ) {
      const newFilters = [
        ...state.imageFilters["partition"],
        ...action.payload.partitions,
      ].filter(distinctFilter);
      state.imageFilters["partition"] = newFilters;
    },
    removeImagePartitionFilters(
      state,
      action: PayloadAction<{
        partitions?: string[];
        all?: boolean;
      }>
    ) {
      if (action.payload.all) {
        state.imageFilters["partition"] = [];
        return;
      }
      if (action.payload.partitions) {
        mutatingFilter(
          state.imageFilters["partition"],
          (partition) => !action.payload.partitions!.includes(partition)
        );
      }
    },
    addAnnotationCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[];
      }>
    ) {
      const newFilters = [
        ...state.annotationFilters["categoryId"],
        ...action.payload.categoryIds,
      ].filter(distinctFilter);
      state.annotationFilters["categoryId"] = newFilters;
    },
    removeAnnotationCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds?: string[];
        all?: boolean;
      }>
    ) {
      if (action.payload.all) {
        state.annotationFilters["categoryId"] = [];
        return;
      }
      if (action.payload.categoryIds) {
        mutatingFilter(
          state.annotationFilters["categoryId"],
          (id) => !action.payload.categoryIds!.includes(id)
        );
      }
    },
  },
});

export const {
  createNewProject,
  selectImages,
  setSelectedImages,
  deselectImages,
  updateHighlightedImageCategory,
  setLoadPercent,
} = projectSlice.actions;
