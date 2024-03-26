import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { createDeferredEntityAdapter } from "store/entities/create_deferred_adapter";

import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { intersection, union } from "lodash";

import {
  Partition,
  PartialBy,
  // NEW_UNKNOWN_CATEGORY,
  // NEW_UNKNOWN_CATEGORY_ID,
} from "types";
import {
  generateUUID,
  isUnknownCategory,
  mutatingFilter,
} from "utils/common/helpers";
import { dispose, TensorContainer } from "@tensorflow/tfjs";
import { NewDataState } from "types/NewData";
import { DeferredEntity, DeferredEntityState } from "store/entities/models";
import { NewCategory, Kind, UNKNOWN_CATEGORY_NAME } from "types/Category";
import { NewImageType } from "types/ImageType";
import {
  NewAnnotationType,
  NewDecodedAnnotationType,
} from "types/AnnotationType";
import { newReplaceDuplicateName } from "utils/common/image/imageHelper";
import { encode } from "utils/annotator/rle/rle";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/colorPalette";

export const kindsAdapter = createDeferredEntityAdapter<Kind>();
export const categoriesAdapter = createDeferredEntityAdapter<NewCategory>();
export const thingsAdapter = createDeferredEntityAdapter<
  NewImageType | NewAnnotationType
>();

export const initialState = (): NewDataState => {
  return {
    kinds: kindsAdapter.getInitialState(),
    categories: categoriesAdapter.getInitialState(),
    things: thingsAdapter.getInitialState(),
  };
};

const updateContents = (
  previousContents: string[],
  contents: string[],
  updateType: "add" | "remove" | "replace"
) => {
  var newContents: string[];

  switch (updateType) {
    case "add":
      newContents = union(previousContents, contents);
      break;
    case "remove":
      newContents = previousContents.filter((a) => !contents.includes(a));
      break;
    case "replace":
      newContents = contents;
  }
  return newContents;
};

export const newDataSlice = createSlice({
  name: "new-data",
  initialState: initialState,
  reducers: {
    resetData: (state) => initialState(),
    initializeState(
      state,
      action: PayloadAction<{
        data: {
          kinds: DeferredEntityState<Kind>;
          categories: DeferredEntityState<NewCategory>;
          things: DeferredEntityState<NewAnnotationType | NewImageType>;
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
    addCategories(
      state,
      action: PayloadAction<{
        categories: Array<NewCategory>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;
      for (const category of categories) {
        if (state.categories.ids.includes(category.id)) continue;

        newDataSlice.caseReducers.updateKindCategories(state, {
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
          } as NewCategory,
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
        } as NewCategory);
      }

      kindsToUpdate.forEach((kind) =>
        newDataSlice.caseReducers.updateKindCategories(state, {
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
        updates: { id: string; changes: { name?: string; color?: string } };
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
        categories: Array<NewCategory>;
        isPermanent?: boolean;
      }>
    ) {
      const { categories, isPermanent } = action.payload;

      newDataSlice.caseReducers.deleteCategories(state, {
        type: "deleteCategories",
        payload: { categoryIds: "all", isPermanent },
      });
      newDataSlice.caseReducers.addCategories(state, {
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

        newDataSlice.caseReducers.updateKindCategories(state, {
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

        newDataSlice.caseReducers.updateCategoryContents(state, {
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
        newDataSlice.caseReducers.updateCategoryContents(state, {
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

        newDataSlice.caseReducers.updateThings(state, {
          type: "updateThings",
          payload: { updates: thingUpdates, isPermanent },
        });
      }
    },

    addThings(
      state,
      action: PayloadAction<{
        things: Array<NewImageType | NewAnnotationType>;
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
                state.things.entities[id] as DeferredEntity<NewImageType>,
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
          newDataSlice.caseReducers.updateKindContents(state, {
            type: "updateKindContents",
            payload: {
              changes: [
                { kindId: thing.kind, contents: [thing.id], updateType: "add" },
              ],
              isPermanent,
            },
          });
          const unknownCategoryId =
            state.kinds.entities[thing.kind].saved.unknownCategoryId;
          thing.categoryId = unknownCategoryId;
        } else {
          const unknownCategoryId = generateUUID({ definesUnknown: true });
          const unknownCategory: NewCategory = {
            id: unknownCategoryId,
            name: UNKNOWN_CATEGORY_NAME,
            color: UNKNOWN_IMAGE_CATEGORY_COLOR,
            containing: [],
            kind: thing.kind,
            visible: true,
          };
          newDataSlice.caseReducers.addCategories(state, {
            type: "addCategories",
            payload: { categories: [unknownCategory] },
          });
          newDataSlice.caseReducers.addKinds(state, {
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
          newDataSlice.caseReducers.updateThingContents(state, {
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

        newDataSlice.caseReducers.updateCategoryContents(state, {
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
        annotations: Array<NewAnnotationType | NewDecodedAnnotationType>;
        isPermanent?: boolean;
      }>
    ) {
      const { annotations, isPermanent } = action.payload;
      const encodedAnnotations: NewAnnotationType[] = [];
      for (const annotation of annotations) {
        if (state.things.ids.includes(annotation.id)) continue;

        if (annotation.decodedMask) {
          (annotation as NewAnnotationType).encodedMask = encode(
            annotation.decodedMask
          );
          delete annotation.decodedMask;
        }
        encodedAnnotations.push(annotation as NewAnnotationType);
      }
      newDataSlice.caseReducers.addThings(state, {
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
        { id: string } & (Partial<NewImageType> | Partial<NewAnnotationType>)
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

      newDataSlice.caseReducers.updateThings(state, {
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
        { id: string } & (Partial<NewImageType> | Partial<NewAnnotationType>)
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
      newDataSlice.caseReducers.updateThings(state, {
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
        updates: Array<
          { id: string } & (Partial<NewImageType> | Partial<NewAnnotationType>)
        >;
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
          newDataSlice.caseReducers.updateCategoryContents(state, {
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
          newDataSlice.caseReducers.updateCategoryContents(state, {
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
      newDataSlice.caseReducers.updateThings(state, {
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
        ] as DeferredEntity<NewImageType>;
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

      for (const thingId of thingIds) {
        const thing = state.things.entities[thingId];
        if (!thing) continue;

        if (getDeferredProperty(thing, "kind") === "Image") {
          const thingContents = getDeferredProperty(
            thing as DeferredEntity<NewImageType>,
            "containing"
          );

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
          const imageId = getDeferredProperty(
            thing as DeferredEntity<NewAnnotationType>,
            "imageId"
          );

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
        const thingKind = getDeferredProperty(thing, "kind");
        const thingCategoryId = getDeferredProperty(thing, "categoryId");

        const kind = state.kinds.entities[thingKind];
        const category = state.categories.entities[thingCategoryId];
        if (isPermanent) {
          if (disposeColorTensors) {
            dispose(thing.saved.data as TensorContainer);
            dispose(thing.changes as TensorContainer);
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

      newDataSlice.caseReducers.updateThingContents(state, {
        type: "updateThingContents",
        payload: { changes: imageChangesArray, isPermanent },
      });
    },

    reconcile(
      state,
      action: PayloadAction<{
        keepChanges: boolean;
      }>
    ) {},
  },
});
