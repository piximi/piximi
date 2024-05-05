import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { createDeferredEntityAdapter } from "store/entities/create_deferred_adapter";

import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { intersection } from "lodash";

import {
  generateUUID,
  isUnknownCategory,
  mutatingFilter,
  newReplaceDuplicateName,
} from "utils/common/helpers";
import { dispose, TensorContainer } from "@tensorflow/tfjs";
import { DataState } from "store/types";
import { DeferredEntity, DeferredEntityState } from "store/entities/models";
import { encode } from "utils/annotator/rle";
import { Partition } from "utils/models/enums";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/constants";
import { PartialBy } from "utils/common/types";
import {
  Kind,
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  ThingsUpdates,
  CategoryUpdates,
} from "./types";
import { UNKNOWN_CATEGORY_NAME } from "./constants";
import { updateContents } from "./helpers";

export const kindsAdapter = createDeferredEntityAdapter<Kind>();
export const categoriesAdapter = createDeferredEntityAdapter<Category>();
export const thingsAdapter = createDeferredEntityAdapter<
  ImageObject | AnnotationObject
>();

export const initialState = (): DataState => {
  return {
    kinds: kindsAdapter.getInitialState(),
    categories: categoriesAdapter.getInitialState(),
    things: thingsAdapter.getInitialState(),
  };
};

export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    resetData: (state) => initialState(),
    initializeState(
      state,
      action: PayloadAction<{
        data: {
          kinds: DeferredEntityState<Kind>;
          categories: DeferredEntityState<Category>;
          things: DeferredEntityState<AnnotationObject | ImageObject>;
        };
      }>
    ) {
      Object.values(state.things.entities).forEach((entity) => {
        dispose(entity as unknown as TensorContainer);
      });

      state.kinds = action.payload.data.kinds;
      state.categories = action.payload.data.categories;
      state.things = action.payload.data.things;
    },
    addKinds(
      state,
      action: PayloadAction<{
        kinds: Array<PartialBy<Kind, "containing">>;
        isPermanent?: boolean;
      }>
    ) {
      const { kinds, isPermanent } = action.payload;
      for (const kind of kinds) {
        if (state.kinds.entities[kind.id]) continue;
        if (!kind.containing) kind.containing = [];

        if (isPermanent) {
          state.kinds.entities[kind.id] = { saved: kind as Kind, changes: {} };
          state.kinds.ids.push(kind.id);
        } else {
          kindsAdapter.addOne(state.kinds, kind as Kind);
        }
      }
    },
    updateKindContents(
      state,
      action: PayloadAction<{
        changes: Array<{
          kindId: string;
          updateType: "add" | "remove" | "replace";
          contents: string[];
        }>;
        isPermanent?: boolean;
      }>
    ) {
      const { changes, isPermanent } = action.payload;
      for (const { kindId, contents, updateType } of changes) {
        const previousContents = getDeferredProperty(
          state.kinds.entities[kindId],
          "containing"
        );

        if (!state.kinds.entities[kindId]) continue;

        const newContents = updateContents(
          previousContents,
          contents,
          updateType
        );
        if (isPermanent) {
          state.kinds.entities[kindId].saved.containing = newContents;
          state.kinds.entities[kindId].changes = {};
        } else {
          kindsAdapter.updateOne(state.kinds, {
            id: kindId,
            changes: { containing: newContents },
          });
        }
      }
    },
    updateKindCategories(
      state,
      action: PayloadAction<{
        changes: Array<{
          kindId: string;
          updateType: "add" | "remove" | "replace";
          categories: string[];
        }>;
        isPermanent?: boolean;
      }>
    ) {
      const { changes, isPermanent } = action.payload;

      for (const { kindId, categories, updateType } of changes) {
        if (!state.kinds.entities[kindId]) continue;
        const previousCategories = getDeferredProperty(
          state.kinds.entities[kindId],
          "categories"
        );

        const newCategories = updateContents(
          previousCategories,
          categories,
          updateType
        );
        if (isPermanent) {
          state.kinds.entities[kindId].saved.categories = newCategories;
          state.kinds.entities[kindId].changes = {};
        } else {
          kindsAdapter.updateOne(state.kinds, {
            id: kindId,
            changes: { categories: newCategories },
          });
        }
      }
    },
    deleteKind(
      state,
      action: PayloadAction<{
        deletedKindId: string;
        isPermanent?: boolean;
      }>
    ) {
      const { deletedKindId, isPermanent } = action.payload;
      const deletedKind = getCompleteEntity(
        state.kinds.entities[deletedKindId]
      );
      if (!deletedKind) return;
      const kindThings = deletedKind.containing;
      const kindCats = deletedKind.categories;

      dataSlice.caseReducers.deleteThings(state, {
        type: "deleteThings",
        payload: {
          thingIds: kindThings,
          isPermanent,
          disposeColorTensors: true,
          preparedByListener: true,
        },
      });
      dataSlice.caseReducers.deleteCategories(state, {
        type: "deleteCategories",
        payload: {
          categoryIds: kindCats,
          isPermanent,
        },
      });

      if (isPermanent) {
        mutatingFilter(state.kinds.ids, (id) => id !== deletedKindId);
        delete state.kinds.entities[deletedKindId];
      } else {
        kindsAdapter.removeOne(state.kinds, deletedKindId);
      }
    },
    addCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;
      for (const category of categories) {
        if (state.categories.ids.includes(category.id)) continue;

        dataSlice.caseReducers.updateKindCategories(state, {
          type: "updateKindCategories",
          payload: {
            changes: [
              {
                kindId: category.kind,
                updateType: "add",
                categories: [category.id],
              },
            ],
            isPermanent,
          },
        });

        categoriesAdapter.addOne(state.categories, category);
        if (isPermanent) {
          state.categories.entities[category.id].changes = {};
        }
      }
    },
    createCategory(
      state,
      action: PayloadAction<{
        name: string;
        color: string;
        kind: string;
        isPermanent?: boolean;
      }>
    ) {
      const { name, color, isPermanent, kind } = action.payload;

      let kindsToUpdate = [];

      if (kind === "all") {
        kindsToUpdate = state.kinds.ids;
      } else {
        kindsToUpdate.push(kind);
      }

      let id = generateUUID();
      let idIsUnique = !state.categories.ids.includes(id);

      while (!idIsUnique) {
        id = generateUUID();
        idIsUnique = !state.categories.ids.includes(id);
      }
      if (isPermanent) {
        state.categories.entities[id] = {
          saved: {
            id: id,
            name: name,
            color: color,
            visible: true,
            containing: [],
            kind: kind,
          } as Category,
          changes: {},
        };
      } else {
        categoriesAdapter.addOne(state.categories, {
          id: id,
          name: name,
          color: color,
          visible: true,
          containing: [],
          kind: kind,
        } as Category);
      }

      kindsToUpdate.forEach((kind) =>
        dataSlice.caseReducers.updateKindCategories(state, {
          type: "updateKindCategories",
          payload: {
            changes: [
              {
                kindId: kind as string,
                updateType: "add",
                categories: [id],
              },
            ],
            isPermanent,
          },
        })
      );
    },
    updateCategory(
      state,
      action: PayloadAction<{
        updates: CategoryUpdates;
        isPermanent?: boolean;
      }>
    ) {
      let { updates, isPermanent } = action.payload;

      const id = updates.id;

      if (isPermanent) {
        state.categories.entities[id].saved = {
          ...state.categories.entities[id].saved,
          ...updates.changes,
        };
      }
      categoriesAdapter.updateOne(state.categories, {
        id: id,
        changes: updates,
      });
    },
    updateCategoryContents(
      state,
      action: PayloadAction<{
        changes: Array<{
          categoryId: string;
          updateType: "add" | "remove" | "replace";
          contents: string[];
        }>;
        isPermanent?: boolean;
      }>
    ) {
      const { changes, isPermanent } = action.payload;
      for (const { categoryId, contents, updateType } of changes) {
        if (!state.categories.entities[categoryId]) continue;
        const previousContents = getDeferredProperty(
          state.categories.entities[categoryId],
          "containing"
        );

        const newContents = updateContents(
          previousContents,
          contents,
          updateType
        );
        if (isPermanent) {
          state.categories.entities[categoryId].saved.containing = newContents;
          state.categories.entities[categoryId].changes = {};
        } else {
          categoriesAdapter.updateOne(state.categories, {
            id: categoryId,
            changes: { containing: newContents },
          });
        }
      }
    },

    setCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;

      dataSlice.caseReducers.deleteCategories(state, {
        type: "deleteCategories",
        payload: { categoryIds: "all", isPermanent },
      });
      dataSlice.caseReducers.addCategories(state, {
        type: "addCategories",
        payload: {
          categories: categories,
          isPermanent: isPermanent,
        },
      });
    },

    deleteCategories(
      state,
      action: PayloadAction<{
        categoryIds: string[] | "all";
        isPermanent?: boolean;
      }>
    ) {
      let { categoryIds, isPermanent } = action.payload;
      if (categoryIds === "all") {
        categoryIds = state.categories.ids as string[];
      }
      for (const categoryId of categoryIds) {
        if (isUnknownCategory(categoryId)) continue;
        if (isPermanent) {
          delete state.categories.entities[categoryId];
          mutatingFilter(state.categories.ids, (catId) => catId !== categoryId);
        } else {
          categoriesAdapter.removeOne(state.categories, categoryId);
        }
      }
    },
    removeCategoriesFromKind(
      state,
      action: PayloadAction<{
        categoryIds: string[] | "all";
        kind: string;
        isPermanent?: boolean;
      }>
    ) {
      //HACK: Should check for empty category. if category empty, delete completely
      let { categoryIds, kind, isPermanent } = action.payload;
      if (categoryIds === "all") {
        categoryIds = state.categories.ids as string[];
      }

      for (const categoryId of categoryIds) {
        if (isUnknownCategory(categoryId)) continue;

        dataSlice.caseReducers.updateKindCategories(state, {
          type: "updateKindCategories",
          payload: {
            changes: [
              { kindId: kind, updateType: "remove", categories: [categoryId] },
            ],
            isPermanent,
          },
        });
        const thingsOfKind = getDeferredProperty(
          state.kinds.entities[kind],
          "containing"
        );
        const thingsOfCategory = getDeferredProperty(
          state.categories.entities[categoryId],
          "containing"
        );
        const thingsToRemove = intersection(thingsOfKind, thingsOfCategory);

        dataSlice.caseReducers.updateCategoryContents(state, {
          type: "updateCategoryContents",
          payload: {
            changes: [
              {
                categoryId: categoryId,
                updateType: "remove",
                contents: thingsToRemove,
              },
            ],
            isPermanent,
          },
        });
        dataSlice.caseReducers.updateCategoryContents(state, {
          type: "updateCategoryContents",
          payload: {
            changes: [
              {
                categoryId: state.kinds.entities[kind].saved.unknownCategoryId,
                updateType: "add",
                contents: thingsToRemove,
              },
            ],
            isPermanent,
          },
        });
        const thingUpdates = thingsToRemove.map((thing) => ({
          id: thing,
          categoryId: state.kinds.entities[kind].saved.unknownCategoryId,
        }));

        dataSlice.caseReducers.updateThings(state, {
          type: "updateThings",
          payload: { updates: thingUpdates, isPermanent },
        });
      }
    },

    addThings(
      state,
      action: PayloadAction<{
        things: Array<ImageObject | AnnotationObject>;
        isPermanent?: boolean;
      }>
    ) {
      const { things, isPermanent } = action.payload;
      for (const thing of things) {
        const [name, ext] = thing.name!.split(".");

        const existingImageIds =
          state.kinds.entities[thing.kind]?.saved.containing ?? [];

        const existingPrefixes = Object.values(existingImageIds).map(
          (id) =>
            (
              getDeferredProperty(
                state.things.entities[id] as DeferredEntity<ImageObject>,
                "name"
              ) as string
            ).split(".")[0]
        );

        let updatedNamePrefix = newReplaceDuplicateName(name, existingPrefixes);

        if (ext) {
          updatedNamePrefix += `.${ext}`;
        }

        thing.name = updatedNamePrefix;
        if (state.kinds.entities[thing.kind]) {
          dataSlice.caseReducers.updateKindContents(state, {
            type: "updateKindContents",
            payload: {
              changes: [
                { kindId: thing.kind, contents: [thing.id], updateType: "add" },
              ],
              isPermanent,
            },
          });
        } else {
          const unknownCategoryId = generateUUID({ definesUnknown: true });
          const unknownCategory: Category = {
            id: unknownCategoryId,
            name: UNKNOWN_CATEGORY_NAME,
            color: UNKNOWN_IMAGE_CATEGORY_COLOR,
            containing: [],
            kind: thing.kind,
            visible: true,
          };
          dataSlice.caseReducers.addCategories(state, {
            type: "addCategories",
            payload: { categories: [unknownCategory] },
          });
          dataSlice.caseReducers.addKinds(state, {
            type: "addKinds",
            payload: {
              kinds: [
                {
                  id: thing.kind,
                  containing: [thing.id],
                  categories: [unknownCategoryId],
                  unknownCategoryId,
                },
              ],
              isPermanent,
            },
          });
        }
        if ("imageId" in thing) {
          dataSlice.caseReducers.updateThingContents(state, {
            type: "updateThingContents",
            payload: {
              changes: [
                {
                  thingId: thing.imageId,
                  contents: [thing.id],
                  updateType: "add",
                },
              ],
              isPermanent,
            },
          });
        }

        dataSlice.caseReducers.updateCategoryContents(state, {
          type: "updateThingContents",
          payload: {
            changes: [
              {
                categoryId: thing.categoryId,
                contents: [thing.id],
                updateType: "add",
              },
            ],
            isPermanent,
          },
        });

        thingsAdapter.addOne(state.things, thing);
        if (isPermanent) {
          state.things.entities[thing.id].changes = {};
        }
      }
    },
    addAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationObject | DecodedAnnotationObject>;
        isPermanent?: boolean;
      }>
    ) {
      const { annotations, isPermanent } = action.payload;
      const encodedAnnotations: AnnotationObject[] = [];
      for (const annotation of annotations) {
        if (state.things.ids.includes(annotation.id)) continue;

        if (annotation.decodedMask) {
          (annotation as AnnotationObject).encodedMask = encode(
            annotation.decodedMask
          );
          delete annotation.decodedMask;
        }
        encodedAnnotations.push(annotation as AnnotationObject);
      }
      dataSlice.caseReducers.addThings(state, {
        type: "addThings",
        payload: { things: encodedAnnotations, isPermanent },
      });
    },
    // Sets the category for the inference images back to Unknown
    clearPredictions(
      state,
      action: PayloadAction<{ kind: string; isPermanent?: boolean }>
    ) {
      const { isPermanent, kind } = action.payload;
      if (!(kind in state.kinds.entities)) return;

      const updates: Array<
        { id: string } & (Partial<ImageObject> | Partial<AnnotationObject>)
      > = [];

      const thingIds = getDeferredProperty(
        state.kinds.entities[kind],
        "containing"
      );

      thingIds.forEach((id) => {
        const thing = getCompleteEntity(state.things.entities[id]);
        if (!thing) return;
        if (thing.partition === Partition.Inference) {
          updates.push({
            id: id as string,
            categoryId: state.kinds.entities[kind].saved.unknownCategoryId,
          });
        }
      });

      dataSlice.caseReducers.updateThings(state, {
        type: "updateThings",
        payload: {
          updates: updates,
          isPermanent: isPermanent,
        },
      });
    },
    acceptPredictions(
      state,
      action: PayloadAction<{ kind: string; isPermanent?: boolean }>
    ) {
      const { isPermanent, kind } = action.payload;
      if (!(kind in state.kinds.entities)) return;
      const thingIds = getDeferredProperty(
        state.kinds.entities[kind],
        "containing"
      );
      const updates: Array<
        { id: string } & (Partial<ImageObject> | Partial<AnnotationObject>)
      > = [];
      thingIds.forEach((id) => {
        const thing = getCompleteEntity(state.things.entities[id]);
        if (!thing) return;
        const imagePartition = thing.partition;
        const categoryId = thing.categoryId;
        if (
          imagePartition === Partition.Inference &&
          !isUnknownCategory(categoryId)
        ) {
          updates.push({
            id: id as string,
            partition: Partition.Unassigned,
          });
        }
      });
      dataSlice.caseReducers.updateThings(state, {
        type: "updateThings",
        payload: {
          updates: updates,
          isPermanent: isPermanent,
        },
      });
    },

    updateThings(
      state,
      action: PayloadAction<{
        updates: ThingsUpdates;
        isPermanent?: boolean;
      }>
    ) {
      const { updates, isPermanent } = action.payload;

      for (const update of updates) {
        const { id, ...changes } = update;

        if (!state.things.ids.includes(id)) continue;

        if ("categoryId" in changes) {
          const oldCategory = getDeferredProperty(
            state.things.entities[id],
            "categoryId"
          );
          dataSlice.caseReducers.updateCategoryContents(state, {
            type: "updateCategoryContents",
            payload: {
              changes: [
                {
                  categoryId: oldCategory,
                  updateType: "remove",
                  contents: [id],
                },
              ],
              isPermanent,
            },
          });
          dataSlice.caseReducers.updateCategoryContents(state, {
            type: "updateCategoryContents",
            payload: {
              changes: [
                {
                  categoryId: changes.categoryId!,
                  updateType: "add",
                  contents: [id],
                },
              ],
              isPermanent,
            },
          });
        }

        if (isPermanent) {
          Object.assign(state.things.entities[id].saved, changes);
        } else {
          thingsAdapter.updateOne(state.things, { id, changes });
        }
      }
    },
    updateThingName(
      state,
      action: PayloadAction<{ id: string; name: string; isPermanent: boolean }>
    ) {
      const { id, name, isPermanent } = action.payload;
      const changes: Array<{ id: string; name: string }> = [{ id, name }];
      const thing = getCompleteEntity(state.things.entities[id]);
      if (thing) {
        if ("containing" in thing) {
          const containedThingIds = thing.containing;
          containedThingIds.forEach((containedId) => {
            const containedThing = getCompleteEntity(
              state.things.entities[containedId]
            );
            if (containedThing) {
              const containedThingName = containedThing.name;
              if (containedThing.name.includes(thing.name)) {
                changes.push({
                  id: containedId,
                  name: containedThingName.replace(thing.name, name),
                });
              }
            }
          });
        }
      }
      dataSlice.caseReducers.updateThings(state, {
        type: "updateThings",
        payload: { updates: changes, isPermanent },
      });
    },
    updateThingContents(
      state,
      action: PayloadAction<{
        changes: Array<{
          thingId: string;
          updateType: "add" | "remove" | "replace";
          contents: string[];
        }>;
        isPermanent?: boolean;
      }>
    ) {
      const { changes, isPermanent } = action.payload;
      for (const { thingId, contents, updateType } of changes) {
        const thing = state.things.entities[
          thingId
        ] as DeferredEntity<ImageObject>;
        if (!("containing" in state.things.entities[thingId].saved)) continue;
        const previousContents = getDeferredProperty(thing, "containing");

        if (!state.things.entities[thingId]) continue;

        const newContents = updateContents(
          previousContents,
          contents,
          updateType
        );
        if (isPermanent) {
          thing.saved.containing = newContents;
          //TODO: Change so entire changes object isnt removed
          thing.changes = {};
        } else {
          thingsAdapter.updateOne(state.things, {
            id: thingId,
            changes: { containing: newContents },
          });
        }
      }
    },
    deleteThings(
      state,
      action: PayloadAction<
        | {
            thingIds: Array<string> | "all" | "annotations";
            activeKind?: string;
            disposeColorTensors: boolean;
            isPermanent?: boolean;
            preparedByListener?: boolean;
          }
        | {
            ofKinds: Array<string>;
            activeKind?: string;
            disposeColorTensors: boolean;
            isPermanent?: boolean;
            preparedByListener?: boolean;
          }
        | {
            ofCategories: Array<string>;
            activeKind: string;
            disposeColorTensors: boolean;
            isPermanent?: boolean;
            preparedByListener?: boolean;
          }
      >
    ) {
      if (!action.payload.preparedByListener) return;
      if (!("thingIds" in action.payload)) return;
      const { thingIds, disposeColorTensors, isPermanent } = action.payload;
      const imageChanges: Record<
        string,
        {
          thingId: string;
          updateType: "add" | "remove" | "replace";
          contents: string[];
        }
      > = {};
      const imageChangesArray: Array<{
        thingId: string;
        updateType: "add" | "remove" | "replace";
        contents: string[];
      }> = [];
      for (const thingId of [...thingIds]) {
        const thingEntity = state.things.entities[thingId];
        const thing = getCompleteEntity(state.things.entities[thingId]);

        if (!thing) continue;

        if ("containing" in thing) {
          const thingContents = thing.containing;

          if (thingContents) {
            for (const containedThingId of thingContents) {
              const containedThing = state.things.entities[containedThingId];
              if (!containedThing) continue;

              const thingKind = getDeferredProperty(containedThing, "kind");
              const thingCategoryId = getDeferredProperty(
                containedThing,
                "categoryId"
              );
              const kind = state.kinds.entities[thingKind];
              const category = state.categories.entities[thingCategoryId];
              if (isPermanent) {
                if (disposeColorTensors) {
                  dispose(containedThing.saved.data as TensorContainer);
                  dispose(containedThing.changes as TensorContainer);
                }

                /* UPDATE KIND'S CONTAINING LIST */
                mutatingFilter(
                  kind.saved.containing,
                  (containedId) => containedId !== containedThingId
                );
                if (kind.changes.containing) {
                  mutatingFilter(
                    kind.changes.containing,
                    (containedId) => containedId !== containedThingId
                  );
                }
                /* UPDATE CATEGORY'S CONTAINING LIST */
                mutatingFilter(
                  category.saved.containing,
                  (thingId) => thingId !== containedThingId
                );
                if (category.changes.containing) {
                  mutatingFilter(
                    category.changes.containing,
                    (thingId) => thingId !== containedThingId
                  );
                }

                /* REMOVE THING */
                delete state.things.entities[containedThingId];
                mutatingFilter(
                  state.things.ids,
                  (thingId) => thingId !== containedThingId
                );
              } else {
                kind.changes.containing = getDeferredProperty(
                  kind,
                  "containing"
                ).filter((thingId) => thingId !== containedThingId);
                category.changes.containing = getDeferredProperty(
                  category,
                  "containing"
                ).filter((thingId) => thingId !== containedThingId);

                thingsAdapter.removeOne(state.things, containedThingId);
              }
            }
          }
        } else {
          const imageId = thing.imageId;

          if (imageId in imageChanges) {
            imageChanges[imageId].contents.push(thingId);
          } else {
            imageChanges[imageId] = {
              thingId: imageId,
              updateType: "remove",
              contents: [thingId],
            };
          }
        }
        const thingKind = thing.kind;
        const thingCategoryId = thing.categoryId;

        const kind = state.kinds.entities[thingKind];
        const category = state.categories.entities[thingCategoryId];
        if (isPermanent) {
          if (disposeColorTensors) {
            dispose(thingEntity.saved.data as TensorContainer);
            dispose(thingEntity.changes as TensorContainer);
          }

          /* UPDATE KIND'S CONTAINING LIST */

          mutatingFilter(
            kind.saved.containing,
            (containedId) => containedId !== thingId
          );
          if (kind.changes.containing) {
            mutatingFilter(
              kind.changes.containing,
              (containedId) => containedId !== thingId
            );
          }

          /* UPDATE CATEGORY'S CONTAINING LIST */
          mutatingFilter(
            category.saved.containing,
            (_thingId) => _thingId !== thingId
          );
          if (category.changes.containing) {
            mutatingFilter(
              category.changes.containing,
              (_thingId) => _thingId !== thingId
            );
          }

          /* REMOVE THING */
          delete state.things.entities[thingId];
          mutatingFilter(state.things.ids, (_thingId) => _thingId !== thingId);
        } else {
          kind.changes.containing = getDeferredProperty(
            kind,
            "containing"
          ).filter((_thingId) => _thingId !== thingId);
          category.changes.containing = getDeferredProperty(
            category,
            "containing"
          ).filter((_thingId) => _thingId !== thingId);

          thingsAdapter.removeOne(state.things, thingId);
        }
      }
      for (let [imageId, changes] of Object.entries(imageChanges)) {
        if (!thingIds.includes(imageId)) {
          imageChangesArray.push(changes);
        }
      }
      dataSlice.caseReducers.updateThingContents(state, {
        type: "updateThingContents",
        payload: { changes: imageChangesArray, isPermanent },
      });
    },

    reconcile(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {
      if (action.payload.keepChanges) {
        dataSlice.caseReducers.keepChanges(state);
      } else {
        dataSlice.caseReducers.revertChanges(state);
      }
    },

    revertChanges(state) {
      const kindsToRemove = [];
      const categoriesToRemove = [];
      const thingsToRemove = [];
      for (const id of state.kinds.ids) {
        const kind = state.kinds.entities[id];
        if (!kind.changes) continue;
        if ("added" in kind.changes) {
          kindsToRemove.push(id);
          delete state.kinds.entities[id];
        } else {
          kind.changes = {};
        }
      }
      state.kinds.ids = updateContents(
        [...state.kinds.ids] as string[],
        kindsToRemove as string[],
        "remove"
      );
      for (const id of state.categories.ids) {
        const category = state.categories.entities[id];
        if (!category.changes) continue;
        if ("added" in category.changes) {
          categoriesToRemove.push(id);
          delete state.categories.entities[id];
        } else {
          category.changes = {};
        }
      }
      state.categories.ids = updateContents(
        [...state.categories.ids] as string[],
        categoriesToRemove as string[],
        "remove"
      );
      for (const id of state.things.ids) {
        const thing = state.things.entities[id];
        if (!thing.changes) continue;
        if ("added" in thing.changes) {
          dispose(thing.saved.data as TensorContainer);
          dispose(thing.changes.data as TensorContainer);
          thingsToRemove.push(id);
          delete state.things.entities[id];
        } else {
          dispose(thing.changes.data as TensorContainer);
          thing.changes = {};
        }
      }
      state.things.ids = updateContents(
        [...state.things.ids] as string[],
        thingsToRemove as string[],
        "remove"
      );
    },
    keepChanges(state) {
      const kindsToRemove = [];
      const categoriesToRemove = [];
      const thingsToRemove = [];
      for (const id of state.kinds.ids) {
        const kind = state.kinds.entities[id];

        if (!kind.changes) continue;
        if ("deleted" in kind.changes) {
          kindsToRemove.push(id);
          continue;
        } else {
          let { added, deleted, ...preparedDeferred } = kind.changes;
          Object.assign(kind.saved, preparedDeferred);
          kind.changes = {};
        }
      }
      state.kinds.ids = updateContents(
        [...state.kinds.ids] as string[],
        kindsToRemove as string[],
        "remove"
      );
      for (const id of state.categories.ids) {
        const category = state.categories.entities[id];
        if (!category.changes) continue;
        if ("deleted" in category.changes) {
          categoriesToRemove.push(id);
          delete state.categories.entities[id];
        } else {
          let { added, deleted, ...preparedDeferred } = category.changes;
          Object.assign(category.saved, preparedDeferred);
          category.changes = {};
        }
      }
      state.categories.ids = updateContents(
        [...state.categories.ids] as string[],
        categoriesToRemove as string[],
        "remove"
      );
      for (const id of state.things.ids) {
        const thing = state.things.entities[id];
        if (!thing.changes) continue;
        if ("deleted" in thing.changes) {
          dispose(thing.saved.data as TensorContainer);
          dispose(thing.changes.data as TensorContainer);
          thingsToRemove.push(id);
          delete state.things.entities[id];
        } else {
          let { added, deleted, ...preparedDeferred } = thing.changes;
          Object.assign(thing.saved, preparedDeferred);
          thing.changes = {};
        }
      }
      state.things.ids = updateContents(
        [...state.things.ids] as string[],
        thingsToRemove as string[],
        "remove"
      );
    },
  },
});
