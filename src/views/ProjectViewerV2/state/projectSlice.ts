import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { mutatingFilter, toUnique } from "utils/arrayUtils";

import { ThingSortKey } from "utils/enums";
import { Partition } from "utils/models/enums";
import {
  AnnotationSortType,
  ImageSortType,
  ProjectState,
  ViewState,
} from "./types";
import { difference } from "lodash";

export const initialState: ProjectState = {
  name: "Untitled project",
  activeView: "images",
  selectedThingIds: [],
  sortType: ThingSortKey.None,
  activeKind: "Image",
  thingFilters: {},
  imageGridState: {
    selectedIds: [],
    filters: { categoryId: [], partition: [] },
    sortType: ImageSortType.None,
  },
  annotationGridState: { activeKindId: null, kindStates: {} },
  highlightedCategory: undefined,

  kindTabFilters: [],
  imageChannels: undefined,
};

export const projectSlice = createSlice({
  name: "projectV2",
  initialState: initialState,
  reducers: {
    resetProject() {
      return initialState;
    },

    setProject(state, action: PayloadAction<{ project: ProjectState }>) {
      return action.payload.project;
    },
    setActiveView(state, action: PayloadAction<ViewState>) {
      state.activeView = action.payload;
    },
    setActiveKind(state, action: PayloadAction<string>) {
      if (!state.annotationGridState.kindStates[action.payload]) return;
      state.annotationGridState.activeKindId = action.payload;
    },
    addSelectedImages(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const newIds = difference(state.imageGridState.selectedIds, ids);
      state.imageGridState.selectedIds.push(...newIds);
    },
    removeSelectedImages(state, action: PayloadAction<string[]>) {
      mutatingFilter(
        state.imageGridState.selectedIds,
        (id) => !action.payload.includes(id),
      );
    },
    addSelectedAnnotations(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(kindState.selectedIds, ids);
      kindState.selectedIds.push(...newIds);
    },
    removeSelectedAnnotations(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      mutatingFilter(kindState.selectedIds, (id) => !ids.includes(id));
    },
    selectThings(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      const allSelectedThings = [
        ...new Set([...state.selectedThingIds, ...ids]),
      ];

      state.selectedThingIds = allSelectedThings;
    },
    deselectThings(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      state.selectedThingIds = state.selectedThingIds.filter(
        (id: string) => !ids.includes(id),
      );
    },
    setImageSortType(state, action: PayloadAction<ImageSortType>) {
      state.imageGridState.sortType = action.payload;
    },
    setAnnotationSortType(
      state,
      action: PayloadAction<{ kindId: string; sortType: AnnotationSortType }>,
    ) {
      const { kindId, sortType } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      kindState.sortType = sortType;
    },
    setSortType(state, action: PayloadAction<{ sortType: ThingSortKey }>) {
      state.sortType = action.payload.sortType;
    },
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    addThingCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[];
        kinds?: string[];
      }>,
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
      }>,
    ) {
      const { categoryIds, kinds } = {
        kinds: [state.activeKind],
        ...action.payload,
      };

      for (const kind of kinds) {
        if (!(kind in state.thingFilters)) continue;
        if (categoryIds === "all") {
          state.thingFilters[kind].categoryId = [];
        } else {
          mutatingFilter(
            state.thingFilters[kind].categoryId,
            (id) => !categoryIds!.includes(id),
          );
        }
        if (
          state.thingFilters[kind].categoryId.length === 0 &&
          state.thingFilters[kind].partition.length === 0
        ) {
          delete state.thingFilters[kind];
        }
      }
    },
    addThingPartitionFilters(
      state,
      action: PayloadAction<{
        partitions: Partition[] | "all";
        kinds?: string[];
      }>,
    ) {
      let partitions = action.payload.partitions;
      const kinds = action.payload.kinds ?? [state.activeKind];

      partitions = partitions === "all" ? Object.values(Partition) : partitions;
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
      }>,
    ) {
      const { partitions, kinds } = {
        kinds: [state.activeKind],
        ...action.payload,
      };
      for (const kind of kinds) {
        if (!(kind in state.thingFilters)) continue;
        if (partitions === "all") {
          state.thingFilters[kind].partition = [];
        } else {
          mutatingFilter(
            state.thingFilters[kind].partition,
            (id) => !partitions.includes(id),
          );
        }
        if (
          state.thingFilters[kind].partition.length === 0 &&
          state.thingFilters[kind].categoryId.length === 0
        ) {
          delete state.thingFilters[kind];
        }
      }
    },
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    updateHighlightedCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },
    addImageCategoryFilters(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const newIds = difference(state.imageGridState.filters.categoryId, ids);
      state.imageGridState.filters.categoryId.push(...newIds);
    },
    removeImageCategoryFilters(state, action: PayloadAction<string[]>) {
      const ids = action.payload;

      mutatingFilter(
        state.imageGridState.filters.categoryId,
        (id) => !ids.includes(id),
      );
    },
    addImagePartitionFilters(state, action: PayloadAction<Partition[]>) {
      const ids = action.payload;
      const newIds = difference(state.imageGridState.filters.partition, ids);
      state.imageGridState.filters.partition.push(...newIds);
    },
    removeImagePartitionFilters(state, action: PayloadAction<Partition[]>) {
      const ids = action.payload;

      mutatingFilter(
        state.imageGridState.filters.partition,
        (id) => !ids.includes(id),
      );
    },
    addAnnotationCategoryFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(kindState.filters.categoryId, ids);
      kindState.filters.categoryId.push(...newIds);
    },
    removeAnnotationCategoryFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;

      mutatingFilter(kindState.filters.categoryId, (id) => !ids.includes(id));
    },
    addAnnotationPartitionFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: Partition[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(kindState.filters.partition, ids);
      kindState.filters.partition.push(...newIds);
    },
    removeAnnotationPartitionFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: Partition[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;

      mutatingFilter(kindState.filters.partition, (id) => !ids.includes(id));
    },
    setKindTabVisibility(
      state,
      action: PayloadAction<{ kindId: string; visible: boolean }>,
    ) {
      const kindState =
        state.annotationGridState.kindStates[action.payload.kindId];
      if (kindState) kindState.visible = action.payload.visible;
    },
    setAllKindTabVisibility(state, action: PayloadAction<boolean>) {
      for (const kindId in state.annotationGridState.kindStates) {
        state.annotationGridState.kindStates[kindId].visible = action.payload;
      }
    },

    addKindTabFilter(state, action: PayloadAction<{ kindId: string }>) {
      state.kindTabFilters.push(action.payload.kindId);
    },
    removeKindTabFilter(state, action: PayloadAction<{ kindId: string }>) {
      mutatingFilter(
        state.kindTabFilters,
        (id) => id !== action.payload.kindId,
      );
    },
    removeAllKindTabFilters(state) {
      state.kindTabFilters = [];
    },
    setProjectImageChannels(
      state,
      action: PayloadAction<{ channels: number | undefined }>,
    ) {
      state.imageChannels = action.payload.channels;
    },
  },
});
