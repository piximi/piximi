import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { merge } from "lodash";

import { AnnotationTool } from "views/ImageViewer/utils/tools/AnnotationTool";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";

import { mutatingFilter } from "utils/common/helpers";
import { AnnotatorState } from "views/ImageViewer/utils/types";
import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  Kind,
  ThingsUpdates,
} from "store/data/types";
import { RequireOnly } from "utils/common/types";

export const initialState: AnnotatorState = {
  workingAnnotationId: undefined,

  workingAnnotation: { saved: undefined, changes: {} },
  selectedAnnotationIds: [],
  changes: {
    kinds: { added: {}, deleted: [], edited: {} },
    categories: { added: {}, deleted: [], edited: {} },
    things: { added: {}, deleted: [], edited: {} },
  },
  annotationState: AnnotationState.Blank,
  penSelectionBrushSize: 10,
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  selectionMode: AnnotationMode.New,
  toolType: ToolType.RectangularAnnotation,
};

export const annotatorSlice = createSlice({
  initialState: initialState,
  name: "annotator",
  reducers: {
    resetAnnotator: () => initialState,
    addSelectedAnnotationId(
      state,
      action: PayloadAction<{ annotationId: string }>
    ) {
      state.selectedAnnotationIds.push(action.payload.annotationId);
    },
    addSelectedAnnotationIds(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        annotatorSlice.caseReducers.addSelectedAnnotationId(state, {
          type: "addSelectedAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setSelectedAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
        workingAnnotationId?: string;
      }>
    ) {
      const { annotationIds, workingAnnotationId } = action.payload;
      state.selectedAnnotationIds = [];
      state.workingAnnotationId = workingAnnotationId
        ? workingAnnotationId
        : annotationIds[0];
      annotatorSlice.caseReducers.addSelectedAnnotationIds(state, {
        type: "addSelectedAnnotationIds",
        payload: { annotationIds: action.payload.annotationIds },
      });
    },

    removeSelectedAnnotationId(
      state,
      action: PayloadAction<{
        annotationId: string;
      }>
    ) {
      if (state.workingAnnotationId === action.payload.annotationId) {
        state.workingAnnotationId = undefined;
      }
      mutatingFilter(
        state.selectedAnnotationIds,
        (annotationId) => annotationId !== action.payload.annotationId
      );
    },
    removeSelectedAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: string[];
      }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        annotatorSlice.caseReducers.removeSelectedAnnotationId(state, {
          type: "removeSelectedAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setWorkingAnnotation(
      state,
      action: PayloadAction<{
        annotation: DecodedAnnotationObject | string | undefined;
        preparedByListener?: boolean;
      }>
    ) {
      const { annotation, preparedByListener } = action.payload;
      if (!preparedByListener) return;

      state.workingAnnotation.saved = annotation as
        | DecodedAnnotationObject
        | undefined;
      state.workingAnnotation.changes = {};
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<DecodedAnnotationObject> }>
    ) {
      if (state.workingAnnotation.saved) {
        state.workingAnnotation.changes = action.payload.changes;
      }
    },

    setAnnotationState(
      state,
      action: PayloadAction<{
        annotationState: AnnotationState;
        kind?: string;
        annotationTool: AnnotationTool;
      }>
    ) {
      state.annotationState = action.payload.annotationState;
    },

    setToolType(state, action: PayloadAction<{ operation: ToolType }>) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state,
      action: PayloadAction<{ penSelectionBrushSize: number }>
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setQuickSelectionRegionSize(
      state,
      action: PayloadAction<{ quickSelectionRegionSize: number }>
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionRegionSize;
    },

    setSelectionMode(
      state,
      action: PayloadAction<{ selectionMode: AnnotationMode }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },

    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
    addKind(
      state,
      action: PayloadAction<{
        kind: Kind;
        unknownCategory: Category;
      }>
    ) {
      const { kind, unknownCategory } = action.payload;
      state.changes.kinds.added[kind.id] = kind;
      state.changes.categories.added[unknownCategory.id] = unknownCategory;
    },
    editKind(
      state,
      action: PayloadAction<{
        kind: RequireOnly<Kind, "id">;
      }>
    ) {
      const { kind } = action.payload;
      if (kind.id in state.changes.kinds.added) {
        state.changes.kinds.edited[kind.id] = merge(
          state.changes.kinds.added[kind.id],
          kind
        );
      } else if (kind.id in state.changes.kinds.edited) {
        state.changes.kinds.edited[kind.id] = merge(
          state.changes.kinds.edited[kind.id],
          kind
        );
      } else {
        state.changes.kinds.edited[kind.id] = kind;
      }
    },
    updateKindContents(
      state,
      action: PayloadAction<{
        kindId: string;
        containing?: string[];
        categories?: string[];
      }>
    ) {},

    deleteKind(
      state,
      action: PayloadAction<{
        kindId: string;
      }>
    ) {
      const { kindId } = action.payload;
      let affectedCategories: string[] | undefined;
      let affectedThings: string[] | undefined;
      if (kindId in state.changes.kinds.added) {
        affectedCategories = state.changes.kinds.added[kindId].categories;
        affectedThings = state.changes.kinds.added[kindId].containing;
        delete state.changes.kinds.added[kindId];
      } else if (kindId in state.changes.kinds.edited) {
        affectedCategories = state.changes.kinds.edited[kindId].categories;
        affectedThings = state.changes.kinds.edited[kindId].containing;
        delete state.changes.kinds.edited[kindId];
      }
      if (affectedCategories) {
        for (const categoryId of affectedCategories) {
          delete state.changes.categories.edited[categoryId];
        }
      }
      if (affectedThings) {
        for (const thingId of affectedThings) {
          delete state.changes.things.edited[thingId];
        }
      }
      state.changes.kinds.deleted.push(kindId);
    },

    addCategories(
      state,
      action: PayloadAction<{
        categories: Category | Array<Category>;
      }>
    ) {
      let { categories } = action.payload;
      if (!Array.isArray(categories)) categories = [categories];
      for (const category of categories) {
        state.changes.categories.added[category.id] = category;
      }
    },
    editCategory(
      state,
      action: PayloadAction<{
        category: { id: string; color: string; name: string };
      }>
    ) {
      let { category } = action.payload;

      if (category.id in state.changes.categories.added) {
        state.changes.categories.added[category.id] = merge(
          state.changes.categories.added[category.id],
          category
        );
      } else if (category.id in state.changes.categories.edited) {
        state.changes.categories.edited[category.id] = merge(
          state.changes.categories.edited[category.id],
          category
        );
      } else {
        state.changes.categories.edited[category.id] = category;
      }
    },
    deleteCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        kind: Kind;
      }>
    ) {
      const { categories, kind } = action.payload;
      const unknownCategory = kind.unknownCategoryId;
      const affectedThings: string[] = [];
      for (const category of categories) {
        affectedThings.push(...category.containing);
        if (category.id in state.changes.categories.added) {
          delete state.changes.categories.added[category.id];
          continue;
        }
        delete state.changes.categories.edited[category.id];
        state.changes.categories.deleted.push(category.id);
      }

      // update things
      if (affectedThings.length > 0) {
        state.changes.things.edited = merge(
          state.changes.things.edited,
          affectedThings.reduce(
            (
              edits: Record<string, RequireOnly<AnnotationObject, "id">>,
              id
            ) => {
              edits[id] = { id, categoryId: unknownCategory };
              return edits;
            },
            {}
          )
        );

        // update categories
        // if (unknownCategory in state.changes.categories.added) {
        //   state.changes.categories.added[unknownCategory].containing.push(
        //     ...affectedThings
        //   );
        // } else if (unknownCategory in state.changes.categories.edited) {
        //   if (
        //     "containing" in state.changes.categories.edited[unknownCategory]
        //   ) {
        //     state.changes.categories.edited[unknownCategory].containing!.push(
        //       ...affectedThings
        //     );
        //   } else {
        //     state.changes.categories.edited[unknownCategory].containing =
        //       affectedThings;
        //   }
        // } else {
        //   state.changes.categories.edited[unknownCategory] = {
        //     id: unknownCategory,
        //     containing: affectedThings,
        //   };
        // }
      }
    },
    addThings(
      state,
      action: PayloadAction<{
        things: DecodedAnnotationObject | Array<DecodedAnnotationObject>;
      }>
    ) {
      let { things } = action.payload;
      if (!Array.isArray(things)) things = [things];
      for (const thing of things) {
        state.changes.things.added[thing.id] = thing;
      }
    },
    editThings(
      state,
      action: PayloadAction<{
        updates: ThingsUpdates;
      }>
    ) {
      const { updates } = action.payload;
      for (const update of updates) {
        const { id, ...changes } = update;
        if (id in state.changes.things.added) {
          state.changes.things.added[id] = merge(
            state.changes.things.added[id],
            changes
          );
        } else if (id in state.changes.things.edited) {
          state.changes.things.edited[id] = merge(
            state.changes.things.edited[id],
            changes
          );
        } else {
          state.changes.things.edited[id] = { id, ...changes };
        }
      }
    },
    deleteThings(
      state,
      action: PayloadAction<{
        thingIds: Array<string>;
      }>
    ) {
      const { thingIds } = action.payload;
      for (const thingId of thingIds) {
        if (thingId in state.changes.things.added) {
          delete state.changes.things.added[thingId];
          continue;
        }

        delete state.changes.things.edited[thingId];

        state.changes.things.deleted.push(thingId);
      }
    },
    reconcileChanges(
      state,
      action: PayloadAction<{ discardChanges?: boolean }>
    ) {
      const { discardChanges } = action.payload;
      if (discardChanges) {
        state.changes = initialState.changes;
      }
    },
  },
});
