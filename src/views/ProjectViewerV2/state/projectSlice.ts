import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { findAdjacentItem, mutatingFilter, toUnique } from "utils/arrayUtils";

import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { ThingSortKey } from "utils/enums";
import { Partition } from "utils/models/enums";
import {
  AnnotationSortType,
  ImageSortType,
  KindState,
  ProjectState,
  ViewState,
} from "./types";
import { difference } from "lodash";
import { UNKNOWN_KIND } from "store/dataV2/constants";
import { representsUnknown } from "utils/stringUtils";

const emptyKindState = (id: string, name: string): KindState => ({
  id,
  name,
  selectedIds: [],
  filters: { categoryId: [], partition: [] },
  visible: true,
  sortType: AnnotationSortType.None,
});
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
  annotationGridState: {
    activeKindId: UNKNOWN_KIND.id,
    kindStates: {
      [UNKNOWN_KIND.id]: emptyKindState(UNKNOWN_KIND.id, UNKNOWN_KIND.name),
    },
  },
  highlightedCategory: undefined,

  kindTabFilters: [],
  imageChannels: undefined,
};

function handleImageCategoryDelete(
  state: ProjectState,
  categoryId: string,
): boolean {
  let handled = false;
  const imFilters = state.imageGridState.filters.categoryId;
  const initLen = imFilters.length;
  mutatingFilter(imFilters, (id) => id !== categoryId);
  if (imFilters.length !== initLen) {
    handled = true;
  }

  return handled;
}

function handleAnnCategoryDelete(state: ProjectState, categoryId: string) {
  const kindStates = Object.values(state.annotationGridState.kindStates);
  for (let i = 0; i < kindStates.length; i++) {
    const kindState = kindStates[i];
    const filters = kindState.filters.categoryId;
    const initLength = filters.length;

    mutatingFilter(filters, (id) => id !== categoryId);

    if (initLength !== filters.length) break;
  }
}

export const projectSlice = createSlice({
  name: "projectV2",
  initialState: initialState,
  reducers: {
    resetProject() {
      return initialState;
    },
    setProjectImageChannels(
      state,
      action: PayloadAction<{ channels: number | undefined }>,
    ) {
      state.imageChannels = action.payload.channels;
    },

    setProject(state, action: PayloadAction<{ project: ProjectState }>) {
      return action.payload.project;
    },
    setActiveView(state, action: PayloadAction<ViewState>) {
      state.activeView = action.payload;
    },

    // ~~ Image Grid State
    addSelectedImages(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const newIds = difference(ids, state.imageGridState.selectedIds);
      state.imageGridState.selectedIds.push(...newIds);
    },
    removeSelectedImages(state, action: PayloadAction<string[]>) {
      mutatingFilter(
        state.imageGridState.selectedIds,
        (id) => !action.payload.includes(id),
      );
    },
    setImageSortType(state, action: PayloadAction<ImageSortType>) {
      state.imageGridState.sortType = action.payload;
    },

    addImageCategoryFilters(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const newIds = difference(ids, state.imageGridState.filters.categoryId);
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
      const newIds = difference(ids, state.imageGridState.filters.partition);
      state.imageGridState.filters.partition.push(...newIds);
    },
    removeImagePartitionFilters(state, action: PayloadAction<Partition[]>) {
      const ids = action.payload;

      mutatingFilter(
        state.imageGridState.filters.partition,
        (id) => !ids.includes(id),
      );
    },

    // ~~ Annotation Grid State
    setActiveKind(state, action: PayloadAction<string>) {
      if (!state.annotationGridState.kindStates[action.payload]) return;
      state.annotationGridState.activeKindId = action.payload;
    },
    addSelectedAnnotations(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(ids, kindState.selectedIds);
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

    addAnnotationCategoryFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(ids, kindState.filters.categoryId);
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
      const newIds = difference(ids, kindState.filters.partition);
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

    // ~~ OLD

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
    updateHighlightedCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(dataSliceV2.actions.setState, (state, action) => {
        const { kinds } = action.payload;
        state.imageGridState = { ...initialState.imageGridState };

        state.annotationGridState.kindStates = {};
        let unknownKindId = "";
        for (const kind of kinds) {
          if (representsUnknown(kind.id)) unknownKindId = kind.id;
          state.annotationGridState.kindStates[kind.id] = emptyKindState(
            kind.id,
            kind.name,
          );
        }
        state.annotationGridState.activeKindId = unknownKindId;
        state.activeView = "images";
      })
      .addCase(dataSliceV2.actions.newExperiment, (state) => {
        state.annotationGridState = { ...initialState.annotationGridState };
        state.imageGridState.filters.categoryId = [];
        state.imageGridState.filters.categoryId = [];
        state.imageGridState.selectedIds = [];
      })
      .addCase(dataSliceV2.actions.addKind, (state, action) => {
        state.annotationGridState.kindStates[action.payload.kind.id] =
          emptyKindState(action.payload.kind.id, action.payload.kind.name);
      })
      .addCase(dataSliceV2.actions.batchAddKind, (state, action) => {
        for (const { kind } of action.payload) {
          state.annotationGridState.kindStates[kind.id] = emptyKindState(
            kind.id,
            kind.name,
          );
        }
      })
      .addCase(dataSliceV2.actions.updateKindName, (state, action) => {
        state.annotationGridState.kindStates[action.payload.kindId].name =
          action.payload.name;
      })
      .addCase(dataSliceV2.actions.deleteKind, (state, action) => {
        if (state.annotationGridState.activeKindId === action.payload)
          state.annotationGridState.activeKindId = findAdjacentItem(
            Object.keys(state.annotationGridState.kindStates),
            action.payload,
          );
        delete state.annotationGridState.kindStates[action.payload];
      })
      .addCase(dataSliceV2.actions.deleteImageCategory, (state, action) => {
        handleImageCategoryDelete(state, action.payload);
      })
      .addCase(
        dataSliceV2.actions.deleteAnnotationCategory,
        (state, action) => {
          handleAnnCategoryDelete(state, action.payload);
        },
      )
      .addCase(dataSliceV2.actions.deleteCategory, (state, action) => {
        const catId = action.payload;
        const handled = handleImageCategoryDelete(state, catId);
        if (handled) return;
        handleAnnCategoryDelete(state, catId);
      });
  },
});
