import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { dispose, TensorContainer } from "@tensorflow/tfjs";
import { intersection } from "lodash";

import {
  generateKind,
  generateUUID,
  isUnknownCategory,
  mutatingFilter,
  newReplaceDuplicateName,
} from "utils/common/helpers";
import { encode } from "views/ImageViewer/utils/rle";
import { updateContents } from "./helpers";

import { Partition } from "utils/models/enums";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/constants";
import { UNKNOWN_CATEGORY_NAME } from "./constants";

import { PartialBy } from "utils/common/types";
import { DataState } from "store/types";
import {
  Kind,
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  ThingsUpdates,
  CategoryUpdates,
} from "./types";

const { kind: imageKind, unknownCategory } = generateKind("Image");
export const kindsAdapter = createEntityAdapter<Kind>();
export const categoriesAdapter = createEntityAdapter<Category>();
export const thingsAdapter = createEntityAdapter<
  ImageObject | AnnotationObject
>();

export const initialState = (): DataState => {
  return {
    kinds: kindsAdapter.getInitialState({
      ids: [imageKind.id],
      entities: {
        [imageKind.id]: imageKind,
      },
    }),
    categories: categoriesAdapter.getInitialState({
      ids: [unknownCategory.id],
      entities: {
        [unknownCategory.id]: unknownCategory,
      },
    }),
    things: thingsAdapter.getInitialState(),
  };
};

export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    resetData: (state) => {
      Object.values(state.things.entities).forEach((entity) => {
        dispose(entity!.data as unknown as TensorContainer);
        if ("colors" in entity!) {
          dispose(entity!.colors as unknown as TensorContainer);
        }
      });
      return initialState();
    },
    initializeState(
      state,
      action: PayloadAction<{
        data: {
          kinds: EntityState<Kind, string>;
          categories: EntityState<Category, string>;
          things: EntityState<AnnotationObject | ImageObject, string>;
        };
      }>,
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
      }>,
    ) {
      const { kinds } = action.payload;
      for (const kind of kinds) {
        if (state.kinds.entities[kind.id]) continue;
        if (!kind.containing) kind.containing = [];

        kindsAdapter.addOne(state.kinds, kind as Kind);
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
      }>,
    ) {
      const { changes } = action.payload;
      for (const { kindId, contents, updateType } of changes) {
        if (!state.kinds.entities[kindId]) continue;
        const previousContents = state.kinds.entities[kindId]!.containing;

        const newContents = updateContents(
          previousContents,
          contents,
          updateType,
        );

        kindsAdapter.updateOne(state.kinds, {
          id: kindId,
          changes: { containing: newContents },
        });
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
      }>,
    ) {
      const { changes } = action.payload;

      for (const { kindId, categories, updateType } of changes) {
        if (!state.kinds.entities[kindId]) continue;
        const previousCategories = state.kinds.entities[kindId]!.categories;

        const newCategories = updateContents(
          previousCategories,
          categories,
          updateType,
        );

        kindsAdapter.updateOne(state.kinds, {
          id: kindId,
          changes: { categories: newCategories },
        });
      }
    },
    updateKindName(
      state,
      action: PayloadAction<{
        kindId: string;
        displayName: string;
      }>,
    ) {
      const { kindId, displayName } = action.payload;
      const kind = state.kinds.entities[kindId];
      if (kindId === displayName || !kind) return;
      kindsAdapter.updateOne(state.kinds, {
        id: kindId,
        changes: { displayName: displayName },
      });
    },
    deleteKind(
      state,
      action: PayloadAction<{
        deletedKindId: string;
      }>,
    ) {
      const { deletedKindId } = action.payload;
      if (!state.kinds.entities[deletedKindId]) return;
      const deletedKind = state.kinds.entities[deletedKindId]!;
      const kindThings = deletedKind.containing;
      const kindCats = deletedKind.categories;

      dataSlice.caseReducers.deleteThings(state, {
        type: "deleteThings",
        payload: {
          thingIds: kindThings,
          disposeColorTensors: true,
          preparedByListener: true,
        },
      });
      dataSlice.caseReducers.deleteCategories(state, {
        type: "deleteCategories",
        payload: {
          categoryIds: kindCats,
        },
      });

      kindsAdapter.removeOne(state.kinds, deletedKindId);
    },
    addCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
      }>,
    ) {
      const { categories } = action.payload;
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
          },
        });

        categoriesAdapter.addOne(state.categories, category);
      }
    },
    createCategory(
      state,
      action: PayloadAction<{
        name: string;
        color: string;
        kind: string;
      }>,
    ) {
      const { name, color, kind } = action.payload;

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

      categoriesAdapter.addOne(state.categories, {
        id: id,
        name: name,
        color: color,
        visible: true,
        containing: [],
        kind: kind,
      } as Category);

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
          },
        }),
      );
    },
    updateCategory(
      state,
      action: PayloadAction<{
        updates: CategoryUpdates;
      }>,
    ) {
      const { updates } = action.payload;

      const id = updates.id;

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
      }>,
    ) {
      const { changes } = action.payload;
      for (const { categoryId, contents, updateType } of changes) {
        if (!state.categories.entities[categoryId]) continue;
        const previousContents =
          state.categories.entities[categoryId]!.containing;

        const newContents = updateContents(
          previousContents,
          contents,
          updateType,
        );

        categoriesAdapter.updateOne(state.categories, {
          id: categoryId,
          changes: { containing: newContents },
        });
      }
    },

    setCategories(
      state,
      action: PayloadAction<{
        categories: Array<Category>;
      }>,
    ) {
      const { categories } = action.payload;

      dataSlice.caseReducers.deleteCategories(state, {
        type: "deleteCategories",
        payload: { categoryIds: "all" },
      });
      dataSlice.caseReducers.addCategories(state, {
        type: "addCategories",
        payload: {
          categories: categories,
        },
      });
    },

    deleteCategories(
      state,
      action: PayloadAction<{
        categoryIds: string[] | "all";
      }>,
    ) {
      let { categoryIds } = action.payload;
      if (categoryIds === "all") {
        categoryIds = state.categories.ids as string[];
      }
      for (const categoryId of categoryIds) {
        if (isUnknownCategory(categoryId)) continue;

        categoriesAdapter.removeOne(state.categories, categoryId);
      }
    },
    removeCategoriesFromKind(
      state,
      action: PayloadAction<{
        categoryIds: string[] | "all";
        kind: string;
      }>,
    ) {
      //HACK: Should check for empty category. if category empty, delete completely
      let categoryIds = action.payload.categoryIds;
      const kind = action.payload.kind;
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
          },
        });
        const thingsOfKind = state.kinds.entities[kind]!.containing;

        const thingsOfCategory =
          state.categories.entities[categoryId]!.containing;
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
              {
                categoryId: state.kinds.entities[kind]!.unknownCategoryId,
                updateType: "add",
                contents: thingsToRemove,
              },
            ],
          },
        });

        const thingUpdates = thingsToRemove.map((thing) => ({
          id: thing,
          categoryId: state.kinds.entities[kind]!.unknownCategoryId,
        }));

        dataSlice.caseReducers.updateThings(state, {
          type: "updateThings",
          payload: { updates: thingUpdates },
        });
      }
    },

    addThings(
      state,
      action: PayloadAction<{
        things: Array<ImageObject | AnnotationObject>;
      }>,
    ) {
      const { things } = action.payload;
      for (const readOnlyThing of things) {
        const thing = { ...readOnlyThing };
        const [name, ext] = thing.name!.split(".");

        const existingImageIds =
          state.kinds.entities[thing.kind]?.containing ?? [];

        const existingPrefixes = Object.values(existingImageIds).map(
          (id) => (state.things.entities[id]!.name as string).split(".")[0],
        );

        let updatedNamePrefix = newReplaceDuplicateName(name, existingPrefixes);

        if (ext) {
          updatedNamePrefix += `.${ext}`;
        }

        Object.assign(thing, { name: updatedNamePrefix });
        if (state.kinds.entities[thing.kind]) {
          dataSlice.caseReducers.updateKindContents(state, {
            type: "updateKindContents",
            payload: {
              changes: [
                { kindId: thing.kind, contents: [thing.id], updateType: "add" },
              ],
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
                  displayName: thing.kind,
                  containing: [thing.id],
                  categories: [unknownCategoryId],
                  unknownCategoryId,
                },
              ],
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
          },
        });
        // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
        thingsAdapter.addOne(state.things, thing);
      }
    },
    addAnnotations(
      state,
      action: PayloadAction<{
        annotations: Array<AnnotationObject | DecodedAnnotationObject>;
      }>,
    ) {
      const { annotations } = action.payload;
      const encodedAnnotations: AnnotationObject[] = [];
      for (const annotation of annotations) {
        if (state.things.ids.includes(annotation.id)) continue;

        if (annotation.decodedMask) {
          (annotation as AnnotationObject).encodedMask = encode(
            annotation.decodedMask,
          );
          delete annotation.decodedMask;
        }
        encodedAnnotations.push(annotation as AnnotationObject);
      }
      dataSlice.caseReducers.addThings(state, {
        type: "addThings",
        payload: { things: encodedAnnotations },
      });
    },
    // Sets the category for the inference images back to Unknown
    clearPredictions(
      state,
      action: PayloadAction<{ kind: string; isPermanent?: boolean }>,
    ) {
      const { kind } = action.payload;
      if (!(kind in state.kinds.entities)) return;

      const updates: Array<
        { id: string } & (Partial<ImageObject> | Partial<AnnotationObject>)
      > = [];

      const thingIds = state.kinds.entities[kind]!.containing;

      thingIds.forEach((id) => {
        const thing = state.things.entities[id];
        if (!thing) return;
        if (thing.partition === Partition.Inference) {
          updates.push({
            id: id as string,
            categoryId: state.kinds.entities[kind]!.unknownCategoryId,
          });
        }
      });

      dataSlice.caseReducers.updateThings(state, {
        type: "updateThings",
        payload: {
          updates: updates,
        },
      });
    },
    acceptPredictions(
      state,
      action: PayloadAction<{ kind: string; isPermanent?: boolean }>,
    ) {
      const { kind } = action.payload;
      if (!state.kinds.entities[kind]) return;
      const thingIds = state.kinds.entities[kind]!.containing;
      const updates: Array<
        { id: string } & (Partial<ImageObject> | Partial<AnnotationObject>)
      > = [];
      thingIds.forEach((id) => {
        const thing = state.things.entities[id];
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
        },
      });
    },

    updateThings(
      state,
      action: PayloadAction<{
        updates: ThingsUpdates;
      }>,
    ) {
      const { updates } = action.payload;

      for (const update of updates) {
        const { id, ...changes } = update;

        if (!state.things.ids.includes(id)) continue;

        if ("categoryId" in changes) {
          const oldCategory = state.things.entities[id]!.categoryId;

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
            },
          });
        }

        // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
        thingsAdapter.updateOne(state.things, { id, changes });
      }
    },
    updateThingName(
      state,
      action: PayloadAction<{ id: string; name: string }>,
    ) {
      const { id, name } = action.payload;
      const changes: Array<{ id: string; name: string }> = [{ id, name }];
      const thing = state.things.entities[id];
      if (thing) {
        if ("containing" in thing) {
          const containedThingIds = thing.containing;
          containedThingIds.forEach((containedId) => {
            const containedThing = state.things.entities[containedId];
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
        payload: { updates: changes },
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
      }>,
    ) {
      const { changes } = action.payload;
      for (const { thingId, contents, updateType } of changes) {
        const thing = state.things.entities[thingId] as ImageObject;
        if (!("containing" in thing)) continue;
        const previousContents = thing.containing;

        if (!state.things.entities[thingId]) continue;

        const newContents = updateContents(
          previousContents,
          contents,
          updateType,
        );

        // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
        thingsAdapter.updateOne(state.things, {
          id: thingId,
          changes: { containing: newContents },
        });
      }
    },
    deleteThings(
      state,
      action: PayloadAction<
        | {
            thingIds: Array<string> | "all" | "annotations";
            activeKind?: string;
            disposeColorTensors: boolean;
            preparedByListener?: boolean;
          }
        | {
            ofKinds: Array<string>;
            activeKind?: string;
            disposeColorTensors: boolean;
            preparedByListener?: boolean;
          }
        | {
            ofCategories: Array<string>;
            activeKind: string;
            disposeColorTensors: boolean;
            preparedByListener?: boolean;
          }
      >,
    ) {
      if (!action.payload.preparedByListener) return;
      if (!("thingIds" in action.payload)) return;
      const { thingIds } = action.payload;
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
        const thing = state.things.entities[thingId];

        if (!thing) continue;

        if ("containing" in thing) {
          const thingContents = thing.containing;

          if (thingContents) {
            for (const containedThingId of thingContents) {
              const containedThing = state.things.entities[containedThingId];
              if (!containedThing) continue;

              const thingKind = containedThing.kind;
              const thingCategoryId = containedThing.categoryId;
              const kind = state.kinds.entities[thingKind];
              const category = state.categories.entities[thingCategoryId];

              dispose(containedThing.data as TensorContainer);

              /* UPDATE KIND'S CONTAINING LIST */
              mutatingFilter(
                kind!.containing,
                (containedId) => containedId !== containedThingId,
              );

              /* UPDATE CATEGORY'S CONTAINING LIST */
              mutatingFilter(
                category!.containing,
                (thingId) => thingId !== containedThingId,
              );

              /* REMOVE THING */
              delete state.things.entities[containedThingId];
              mutatingFilter(
                state.things.ids,
                (thingId) => thingId !== containedThingId,
              );

              // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
              thingsAdapter.removeOne(state.things, containedThingId);
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

        dispose(thing.data as TensorContainer);

        /* UPDATE KIND'S CONTAINING LIST */

        mutatingFilter(
          kind!.containing,
          (containedId) => containedId !== thingId,
        );

        /* UPDATE CATEGORY'S CONTAINING LIST */
        mutatingFilter(
          category!.containing,
          (_thingId) => _thingId !== thingId,
        );

        // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
        thingsAdapter.removeOne(state.things, thingId);
      }
      for (const [imageId, changes] of Object.entries(imageChanges)) {
        if (!thingIds.includes(imageId)) {
          imageChangesArray.push(changes);
        }
      }
      dataSlice.caseReducers.updateThingContents(state, {
        type: "updateThingContents",
        payload: { changes: imageChangesArray },
      });
    },
  },
});
