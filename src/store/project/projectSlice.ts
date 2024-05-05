import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ProjectState } from "store/types";
import { ThingSortKey } from "utils/common/enums";
import { mutatingFilter, toUnique } from "utils/common/helpers";
import { Partition } from "utils/models/enums";

export const initialState: ProjectState = {
  name: "Untitled project",
  selectedThingIds: [],
  sortType: ThingSortKey.None,
  activeKind: "Image",
  thingFilters: {},

  highlightedCategory: undefined,
  loadPercent: 1,
  loadMessage: "",
  kindTabFilters: [],
  imageChannels: 3,
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    resetProject: () => initialState,

    createNewProject(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
      state.sortType = ThingSortKey.None;
    },
    setProject(state, action: PayloadAction<{ project: ProjectState }>) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.project;
      return action.payload.project;
    },
    setActiveKind(state, action: PayloadAction<{ kind: string }>) {
      state.activeKind = action.payload.kind;
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
        ...new Set([...state.selectedThingIds, ...ids]),
      ];

      state.selectedThingIds = allSelectedThings;
    },
    deselectThings(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      state.selectedThingIds = state.selectedThingIds.filter(
        (id: string) => !ids.includes(id)
      );
    },
    setSortType_new(state, action: PayloadAction<{ sortType: ThingSortKey }>) {
      state.sortType = action.payload.sortType;
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
    updateHighlightedCategory(
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
        } else {
          mutatingFilter(
            state.thingFilters[kind].categoryId,
            (id) => !categoryIds!.includes(id)
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
        } else {
          mutatingFilter(
            state.thingFilters[kind].partition,
            (id) => !partitions.includes(id)
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
    addKindTabFilter(state, action: PayloadAction<{ kindId: string }>) {
      state.kindTabFilters.push(action.payload.kindId);
    },
    removeKindTabFilter(state, action: PayloadAction<{ kindId: string }>) {
      mutatingFilter(
        state.kindTabFilters,
        (id) => id !== action.payload.kindId
      );
    },
    removeAllKindTabFilters(state) {
      state.kindTabFilters = [];
    },
  },
});
