import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AnnotationTool } from "views/ImageViewer/utils/tools/AnnotationTool";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";

import { mutatingFilter } from "utils/arrayUtils";
import {
  AnnotatorState,
  ProtoAnnotationObject,
} from "views/ImageViewer/utils/types";
import { Category, Kind, ThingsUpdates } from "store/data/types";
import {
  addCategoryContents,
  addKindContents,
  deleteCategoryEntry,
  deleteKindEntry,
  deleteThingEntry,
  editCategory,
  removeCategoryContents,
  removeKindContents,
  updateKind,
  updateThing,
} from "./utils";

export const initialState: AnnotatorState = {
  workingAnnotationId: undefined,

  workingAnnotation: { saved: undefined, changes: {} },
  selectedAnnotationIds: [],
  changes: {
    kinds: { added: {}, deleted: [], edited: {} },
    categories: { added: {}, deleted: [], edited: {} },
    things: { added: {}, deleted: [], edited: {} },
    images: {},
    annotations: { added: {}, deleted: [], edited: {} },
  },
  annotationState: AnnotationState.Blank,
  penSelectionBrushSize: 10,
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  annotationMode: AnnotationMode.New,
  toolType: ToolType.RectangularAnnotation,
};

export const annotatorSlice = createSlice({
  initialState: initialState,
  name: "annotator",
  reducers: {
    resetAnnotator: () => initialState,
    resetChanges: (state) => {
      state.changes = initialState.changes;
    },
    addSelectedAnnotationId(
      state,
      action: PayloadAction<{ annotationId: string }>,
    ) {
      state.selectedAnnotationIds.push(action.payload.annotationId);
    },
    addSelectedAnnotationIds(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>,
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
      }>,
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
      }>,
    ) {
      if (state.workingAnnotationId === action.payload.annotationId) {
        state.workingAnnotationId = undefined;
      }
      mutatingFilter(
        state.selectedAnnotationIds,
        (annotationId) => annotationId !== action.payload.annotationId,
      );
    },
    removeSelectedAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: string[];
      }>,
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
        annotation: ProtoAnnotationObject | string | undefined;
        preparedByListener?: boolean;
      }>,
    ) {
      const { annotation, preparedByListener } = action.payload;
      if (!preparedByListener) return;

      state.workingAnnotation.saved = annotation as
        | ProtoAnnotationObject
        | undefined;
      state.workingAnnotation.changes = {};
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<ProtoAnnotationObject> }>,
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
      }>,
    ) {
      state.annotationState = action.payload.annotationState;
    },

    setToolType(state, action: PayloadAction<{ operation: ToolType }>) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state,
      action: PayloadAction<{ penSelectionBrushSize: number }>,
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setQuickSelectionRegionSize(
      state,
      action: PayloadAction<{ quickSelectionRegionSize: number }>,
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionRegionSize;
    },

    setAnnotationMode(
      state,
      action: PayloadAction<{ annotationMode: AnnotationMode }>,
    ) {
      state.annotationMode = action.payload.annotationMode;
    },

    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>,
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
    addKind(
      state,
      action: PayloadAction<{
        kind: Kind;
        unknownCategory: Category;
      }>,
    ) {
      const { kind, unknownCategory } = action.payload;
      state.changes.kinds.added[kind.id] = kind;
      state.changes.categories.added[unknownCategory.id] = unknownCategory;
    },
    editKindName(
      state,
      action: PayloadAction<{
        kindId: string;
        displayName: string;
      }>,
    ) {
      const { kindId, displayName } = action.payload;
      updateKind(state, { id: kindId, displayName });
    },

    deleteKind(
      state,
      action: PayloadAction<{
        kind: Kind;
      }>,
    ) {
      const { id: kindId, categories, containing } = action.payload.kind;

      // keep track of affected categories and things
      const affectedCategories = categories;
      const affectedThings = containing;
      // keep track of whether the kind was added during this annotation session

      deleteKindEntry(state, kindId);

      for (const categoryId of affectedCategories) {
        deleteCategoryEntry(state, categoryId);
      }

      for (const thingId of affectedThings) {
        deleteThingEntry(state, thingId);
      }
    },

    addCategory(
      state,
      action: PayloadAction<{
        category: Category;
      }>,
    ) {
      const { category } = action.payload;
      state.changes.categories.added[category.id] = category;
      addKindContents(state, {
        id: category.kind,
        categories: [category.id],
      });
    },
    updateCategory(
      state,
      action: PayloadAction<{
        category: { id: string; color: string; name: string };
      }>,
    ) {
      const { category } = action.payload;
      editCategory(state, category);
    },
    deleteCategory(
      state,
      action: PayloadAction<{
        category: Category;
        associatedUnknownKind: string;
      }>,
    ) {
      const { category, associatedUnknownKind } = action.payload;
      const associatedThings = category.containing;
      deleteCategoryEntry(state, category.id);
      removeKindContents(state, {
        id: category.kind,
        categories: [category.id],
      });
      addCategoryContents(state, associatedUnknownKind, associatedThings);
      associatedThings.forEach((thingId) => {
        updateThing(state, { id: thingId, categoryId: associatedUnknownKind });
      });
    },
    addThing(
      state,
      action: PayloadAction<{
        thing: ProtoAnnotationObject;
      }>,
    ) {
      const { thing } = action.payload;
      state.changes.things.added[thing.id] = thing;
      addKindContents(state, { id: thing.kind, containing: [thing.id] });
      addCategoryContents(state, thing.categoryId, [thing.id]);
    },
    editThings(
      state,
      action: PayloadAction<{
        updates: ThingsUpdates;
      }>,
    ) {
      const { updates } = action.payload;
      for (const update of updates) {
        const { id, ...changes } = update;
        if (id in state.changes.things.added) {
          Object.entries(changes).forEach((change) => {
            //@ts-ignore typescript doesnt know that "changes" contains valid entried for ProtoAnnotationObject
            state.changes.things.added[id][change[0]] = change[1];
          });
        } else if (id in state.changes.things.edited) {
          Object.entries(changes).forEach((change) => {
            //@ts-ignore typescript doesnt know that "changes" contains valid entried for ProtoAnnotationObject
            state.changes.things.edited[id][change[0]] = change[1];
          });
        } else {
          state.changes.things.edited[id] = { id, ...changes };
        }
      }
    },
    deleteThings(
      state,
      action: PayloadAction<{
        things: Array<ProtoAnnotationObject>;
      }>,
    ) {
      const { things } = action.payload;
      for (const thing of things) {
        deleteThingEntry(state, thing.id);
        removeKindContents(state, { id: thing.kind, containing: [thing.id] });
        removeCategoryContents(state, thing.categoryId, [thing.id]);
      }
    },
  },
});
