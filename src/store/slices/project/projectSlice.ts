import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "types/Project";
import {
  defaultImageSortKey,
  ImageSortKey,
  ThingSortKey_new,
} from "types/ImageSortType";
import { distinctFilter, mutatingFilter, toUnique } from "utils/common/helpers";
import { ImageGridTab, Partition } from "types";

export const initialState: Project = {
  selectedImageIds: [],
  name: "Untitled project",
  imageSortKey: defaultImageSortKey.imageSortKey,
  sortType_new: ThingSortKey_new.None,
  highlightedCategory: undefined,
  selectedAnnotationIds: [],
  imageGridTab: "Images",
  loadPercent: 1,
  loadMessage: "",
  imageFilters: { categoryId: [], partition: [] },
  thingFilters: {},
  annotationFilters: { categoryId: [] },
  activeKind: "Image",
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
    setActiveKind(state, action: PayloadAction<{ kind: string }>) {
      state.activeKind = action.payload.kind;
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
    selectThings(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      const allSelectedThings = [
        ...new Set([...state.selectedImageIds, ...ids]),
      ];

      state.selectedImageIds = allSelectedThings;
    },
    deselectThings(
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
    setSortType_new(
      state,
      action: PayloadAction<{ sortType: ThingSortKey_new }>
    ) {
      console.log(action.payload.sortType);
      state.sortType_new = action.payload.sortType;
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
    addThingCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[];
        kinds?: string[];
      }>
    ) {
      const { categoryIds, kinds } = {
        kinds: [state.activeKind],
        ...action.payload,
      };

      for (const kind of kinds) {
        if (kind in state.thingFilters) {
          const existingFilters = state.thingFilters[kind].categoryId ?? [];
          const newFilters = toUnique([...categoryIds, ...existingFilters]);
          state.thingFilters[kind].categoryId = newFilters;
        } else {
          state.thingFilters[kind] = { categoryId: categoryIds, partition: [] };
        }
      }
    },
    removeThingCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[] | "all";
        kinds?: string[];
      }>
    ) {
      const { categoryIds, kinds } = {
        kinds: [state.activeKind],
        ...action.payload,
      };

      for (const kind of kinds) {
        if (!(kind in state.thingFilters)) continue;
        if (categoryIds === "all") {
          state.thingFilters[kind].categoryId = [];
          return;
        } else {
          mutatingFilter(
            state.thingFilters[kind].categoryId,
            (id) => !categoryIds!.includes(id)
          );
        }
      }
    },
    addThingPartitionFilters(
      state,
      action: PayloadAction<{
        partitions: Partition[];
        kinds?: string[];
      }>
    ) {
      const { partitions, kinds } = {
        kinds: [state.activeKind],
        ...action.payload,
      };

      for (const kind of kinds) {
        if (kind in state.thingFilters) {
          const existingFilters = state.thingFilters[kind].partition ?? [];
          const newFilters = toUnique([...partitions, ...existingFilters]);
          state.thingFilters[kind].partition = newFilters;
        } else {
          state.thingFilters[kind] = { categoryId: [], partition: partitions };
        }
      }
    },
    removeThingPartitionFilters(
      state,
      action: PayloadAction<{
        partitions: string[] | "all";
        kinds?: string[];
      }>
    ) {
      const { partitions, kinds } = {
        kinds: [state.activeKind],
        ...action.payload,
      };
      for (const kind of kinds) {
        if (!(kind in state.thingFilters)) continue;
        if (partitions === "all") {
          state.thingFilters[kind].partition = [];
          return;
        } else {
          mutatingFilter(
            state.thingFilters[kind].partition,
            (id) => !partitions.includes(id)
          );
        }
      }
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
