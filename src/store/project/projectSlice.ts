import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { mutatingFilter, toUnique } from "utils/arrayUtils";

import { GridSortKey } from "utils/enums";
import { Partition } from "utils/models/enums";

import { ProjectState } from "store/types";
import { IMAGE_KIND } from "store/data/constants";

export const initialState: ProjectState = {
  name: "Untitled project",
  selectedImages: {},
  selectedAnnotations: {},
  selectedKindItems: {},
  sortType: GridSortKey.None,
  activeKind: IMAGE_KIND,
  kindItemFilters: { [IMAGE_KIND]: { categoryId: [], partition: [] } },
  expandedTime: false,
  activeCtegory: undefined,

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

    selectKindItems(state, action: PayloadAction<Array<string> | string>) {
      const ids =
        typeof action.payload === "string" ? [action.payload] : action.payload;

      const allSelectedKindItems = [
        ...new Set([
          ...(state.selectedKindItems[state.activeKind] ?? []),
          ...ids,
        ]),
      ];

      state.selectedKindItems[state.activeKind] = allSelectedKindItems;
    },
    deselectKindItems(state, action: PayloadAction<Array<string> | string>) {
      const ids =
        typeof action.payload === "string" ? [action.payload] : action.payload;
      mutatingFilter(
        state.selectedKindItems[state.activeKind],
        (id) => !ids.includes(id),
      );
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
        ...new Set([...state.selectedAnnotations[state.activeKind], ...ids]),
      ];

      state.selectedAnnotations[state.activeKind] = allSelectedAnnotations;
    },
    deselectAnnotations(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      mutatingFilter(
        state.selectedAnnotations[state.activeKind],
        (id) => !ids.includes(id),
      );
    },
    resetAnnotationSelection(state) {
      state.selectedAnnotations[state.activeKind] = [];
    },
    selectImages(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      const allSelectedImages = [
        ...new Set([...state.selectedImages[state.activeKind], ...ids]),
      ];

      state.selectedAnnotations[state.activeKind] = allSelectedImages;
    },
    deselectImages(
      state,
      action: PayloadAction<{ ids: Array<string> | string }>,
    ) {
      const ids =
        typeof action.payload.ids === "string"
          ? [action.payload.ids]
          : action.payload.ids;
      mutatingFilter(
        state.selectedImages[state.activeKind],
        (id) => !ids.includes(id),
      );
    },

    resetImageSelection(state) {
      state.selectedImages = {};
    },

    setSortType(state, action: PayloadAction<{ sortType: GridSortKey }>) {
      state.sortType = action.payload.sortType;
    },
    setProjectName(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name;
    },

    changeActiveCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.activeCtegory = action.payload.categoryId;
    },
    addKindItemCategoryFilters(
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
        if (kind in state.kindItemFilters) {
          const existingFilters = state.kindItemFilters[kind].categoryId ?? [];
          const newFilters = toUnique([...categoryIds, ...existingFilters]);
          state.kindItemFilters[kind].categoryId = newFilters;
        } else {
          state.kindItemFilters[kind] = {
            categoryId: categoryIds,
            partition: [],
          };
        }
      }
    },
    removeKindItemCategoryFilters(
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
        if (!(kind in state.kindItemFilters)) continue;
        if (categoryIds === "all") {
          state.kindItemFilters[kind].categoryId = [];
        } else {
          mutatingFilter(
            state.kindItemFilters[kind].categoryId,
            (id) => !categoryIds.includes(id as string),
          );
        }
      }
    },
    addKindItemPartitionFilters(
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
        if (kind in state.kindItemFilters) {
          const existingFilters = state.kindItemFilters[kind].partition ?? [];
          const newFilters = toUnique([...partitions, ...existingFilters]);
          state.kindItemFilters[kind].partition = newFilters;
        } else {
          state.kindItemFilters[kind] = {
            categoryId: [],
            partition: partitions,
          };
        }
      }
    },
    removeKindItemPartitionFilters(
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
        if (!(kind in state.kindItemFilters)) continue;
        if (partitions === "all") {
          state.kindItemFilters[kind].partition = [];
        } else {
          mutatingFilter(
            state.kindItemFilters[kind].partition,
            (id) => !partitions.includes(id),
          );
        }
      }
    },
    addKindToItemFilters(state, action: PayloadAction<string>) {
      const kind = action.payload;
      if (kind in state.kindItemFilters) {
        console.error(`Kind ${kind} already exists in filters, skipping...`);
        return;
      }
      state.kindItemFilters[kind] = { categoryId: [], partition: [] };
    },
    removeKindFromItemFilters(state, action: PayloadAction<string>) {
      const kind = action.payload;
      delete state.kindItemFilters[kind];
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
    toggleTimeExpansion(state) {
      state.expandedTime = !state.expandedTime;
    },
  },
});
