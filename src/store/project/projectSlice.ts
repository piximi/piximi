import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { mutatingFilter, toUnique } from "utils/arrayUtils";

import { GridSortKey } from "utils/enums";
import { Partition } from "utils/models/enums";

import { ProjectState } from "store/types";
import { updateRecordArray } from "utils/objectUtils";

export const initialState: ProjectState = {
  name: "Untitled project",
  selectedThingIds: [],
  selectedImages: {},
  selectedAnnotations: [],
  sortType: GridSortKey.None,
  activeKind: "Image",
  thingFilters: {},

  highlightedCategory: undefined,

  kindTabFilters: [],
  imageChannels: undefined,
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    resetProject: () => initialState,
    createNewProject(state, action: PayloadAction<{ name: string }>) {
      Object.assign(state, initialState, { name: action.payload.name });
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
    selectAnnotations(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      const allSelectedAnnotations = [
        ...new Set([...state.selectedAnnotations, ...ids]),
      ];

      state.selectedAnnotations = allSelectedAnnotations;
    },
    deselectAnnotations(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      mutatingFilter(state.selectedAnnotations, (id) => !ids.includes(id));
    },
    resetAnnotationSelection(state) {
      state.selectedAnnotations = [];
    },
    selectImages(
      state,
      action: PayloadAction<{
        selection:
          | Array<{ id: string; timepoint: number }>
          | { id: string; timepoint: number };
      }>,
    ) {
      const selectionArray = Array.isArray(action.payload.selection)
        ? action.payload.selection
        : [action.payload.selection];

      selectionArray.forEach((image) => {
        updateRecordArray(state.selectedImages, image.id, image.timepoint);
      });
    },
    deselectImages(
      state,
      action: PayloadAction<{
        selection:
          | Array<{ id: string; timepoint: number }>
          | { id: string; timepoint: number };
      }>,
    ) {
      const selectionArray = Array.isArray(action.payload.selection)
        ? action.payload.selection
        : [action.payload.selection];

      selectionArray.forEach((image) => {
        const selectedTimepoints = state.selectedImages[image.id];
        if (!selectedTimepoints)
          throw new Error(
            `Image with id "${image.id}" not previously selected`,
          );
        mutatingFilter(
          state.selectedImages[image.id],
          (timepoint) => timepoint !== image.timepoint,
        );
        if (state.selectedImages[image.id].length === 0)
          delete state.selectedImages[image.id];
      });
    },
    resetImageSelection(state) {
      state.selectedImages = {};
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
    setSortType(state, action: PayloadAction<{ sortType: GridSortKey }>) {
      state.sortType = action.payload.sortType;
    },
    setProjectName(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
    },

    updateHighlightedCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
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
