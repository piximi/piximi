// import {
//   createEntityAdapter,
//   createSlice,
//   Draft,
//   EntityState,
//   PayloadAction,
// } from "@reduxjs/toolkit";
// import { dispose, TensorContainer } from "@tensorflow/tfjs";
// import { difference, intersection } from "lodash";

// import { generateUUID, generateKind, isUnknownCategory } from "./utils";
// import { encode } from "views/ImageViewer/utils/rle";
// import { updateContents } from "./utils";

// import {
//   UNKNOWN_CATEGORY_NAME,
//   UNKNOWN_IMAGE_CATEGORY_COLOR,
// } from "./constants";

// import { getUniqueName } from "utils/stringUtils";
// import { mutatingFilter } from "utils/arrayUtils";

// import { PartialBy } from "utils/types";
// import { DataState } from "store/types";
// import {
//   Kind,
//   AnnotationObject,
//   Category,
//   ImageObject,
//   ThingsUpdates,
//   CategoryUpdates,
//   TSImageObject,
//   TSAnnotationObject,
//   DecodedTSAnnotationObject,
//   ImageUpdates,
//   AnnotationUpdates,
//   ImageTimepointData,
//   TPKey,
// } from "./types";

// const { kind: imageKind, unknownCategory } = generateKind("Image");
// export const kindsAdapter = createEntityAdapter<Kind>();
// export const categoriesAdapter = createEntityAdapter<Category>();
// export const thingsAdapter = createEntityAdapter<
//   ImageObject | AnnotationObject
// >();
// export const imagesAdapter = createEntityAdapter<TSImageObject>();
// export const annotationsAdapter = createEntityAdapter<TSAnnotationObject>();

// const initialState = (): DataState => {
//   return {
//     kinds: kindsAdapter.getInitialState({
//       ids: [imageKind.id],
//       entities: {
//         [imageKind.id]: imageKind,
//       },
//     }),
//     categories: categoriesAdapter.getInitialState({
//       ids: [unknownCategory.id],
//       entities: {
//         [unknownCategory.id]: unknownCategory,
//       },
//     }),
//     things: thingsAdapter.getInitialState(),
//     images: imagesAdapter.getInitialState(),
//     annotations: annotationsAdapter.getInitialState(),
//     linkGraph: {},
//     globalAnnotations: {},
//   };
// };

// export const dataSlice = createSlice({
//   name: "data",
//   initialState: initialState,
//   reducers: {
//     resetData: (state) => {
//       Object.values(state.things.entities).forEach((entity) => {
//         dispose(entity!.data as unknown as TensorContainer);
//         if ("colors" in entity!) {
//           dispose(entity!.colors as unknown as TensorContainer);
//         }
//       });
//       Object.values(state.images.entities).forEach((entity) => {
//         Object.values(entity.timepoints).forEach((frame) => {
//           dispose(frame.colors as unknown as TensorContainer);
//           dispose(frame.data as unknown as TensorContainer);
//         });
//       });
//       Object.values(state.annotations.entities).forEach((entity) => {
//         dispose(entity!.data as unknown as TensorContainer);
//         if ("colors" in entity!) {
//           dispose(entity!.colors as unknown as TensorContainer);
//         }
//       });
//       return initialState();
//     },
//     initializeState(
//       state,
//       action: PayloadAction<{
//         data: {
//           kinds: EntityState<Kind, string>;
//           categories: EntityState<Category, string>;
//           images: EntityState<TSImageObject, string>;
//           annotations: EntityState<TSAnnotationObject, string>;
//         };
//       }>,
//     ) {
//       Object.values(state.things.entities).forEach((entity) => {
//         dispose(entity as unknown as TensorContainer);
//       });
//       dataSlice.caseReducers.resetData(state);
//       state.kinds = action.payload.data.kinds;
//       state.categories = action.payload.data.categories;
//       state.images = action.payload.data.images;
//       state.annotations = action.payload.data.annotations;
//     },
//     addKinds(
//       state,
//       action: PayloadAction<{
//         kinds: Array<PartialBy<Kind, "containing">>;
//       }>,
//     ) {
//       const { kinds } = action.payload;
//       for (const kind of kinds) {
//         if (state.kinds.entities[kind.id]) continue;
//         if (!kind.containing) kind.containing = [];

//         kindsAdapter.addOne(state.kinds, kind as Kind);
//       }
//     },
//     // Exclusively updates kinds in store. Unsafe because it does not:
//     // - Reconcile existence (or lack thereof) of categories
//     // - Reconcile existence (or lack thereof) of things
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     updateKinds_unsafe(
//       state,
//       action: PayloadAction<{
//         updates: Array<{ id: string; changes: Omit<Partial<Kind>, "id"> }>;
//       }>,
//     ) {
//       kindsAdapter.updateMany(state.kinds, action.payload.updates);
//     },
//     updateKindContents(
//       state,
//       action: PayloadAction<{
//         changes: Array<{
//           kindId: string;
//           updateType: "add" | "remove" | "replace";
//           contents: string[];
//         }>;
//       }>,
//     ) {
//       const { changes } = action.payload;
//       for (const { kindId, contents, updateType } of changes) {
//         if (!state.kinds.entities[kindId]) continue;
//         const previousContents = state.kinds.entities[kindId]!.containing;

//         const newContents = updateContents(
//           previousContents,
//           contents,
//           updateType,
//         );

//         kindsAdapter.updateOne(state.kinds, {
//           id: kindId,
//           changes: { containing: newContents },
//         });
//       }
//     },
//     updateKindCategories(
//       state,
//       action: PayloadAction<{
//         changes: Array<{
//           kindId: string;
//           updateType: "add" | "remove" | "replace";
//           categories: string[];
//         }>;
//       }>,
//     ) {
//       const { changes } = action.payload;

//       for (const { kindId, categories, updateType } of changes) {
//         if (!state.kinds.entities[kindId]) continue;
//         const previousCategories = state.kinds.entities[kindId]!.categories;

//         const newCategories = updateContents(
//           previousCategories,
//           categories,
//           updateType,
//         );

//         kindsAdapter.updateOne(state.kinds, {
//           id: kindId,
//           changes: { categories: newCategories },
//         });
//       }
//     },
//     updateKindName(
//       state,
//       action: PayloadAction<{
//         kindId: string;
//         displayName: string;
//       }>,
//     ) {
//       const { kindId, displayName } = action.payload;
//       const kind = state.kinds.entities[kindId];
//       if (kindId === displayName || !kind) return;
//       kindsAdapter.updateOne(state.kinds, {
//         id: kindId,
//         changes: { displayName: displayName },
//       });
//     },
//     // Exclusively removes kind. Unsafe because it does not:
//     // - Remove associated categories
//     // - Remove associated things
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     deleteKind_unsafe(state, action: PayloadAction<{ deletedKindId: string }>) {
//       const { deletedKindId } = action.payload;
//       if (!state.kinds.entities[deletedKindId] || deletedKindId === "Image")
//         return;
//       kindsAdapter.removeOne(state.kinds, deletedKindId);
//     },
//     // Exclusively removes kinds. Unsafe because it does not:
//     // - Remove associated categories
//     // - Remove associated things
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     deleteKinds_unsafe(state, action: PayloadAction<{ kindIds: string[] }>) {
//       const { kindIds } = action.payload;
//       if (kindIds.includes("Image")) return;

//       kindsAdapter.removeMany(state.kinds, kindIds);
//     },
//     deleteKind(
//       state,
//       action: PayloadAction<{
//         deletedKindId: string;
//       }>,
//     ) {
//       const { deletedKindId } = action.payload;
//       if (!state.kinds.entities[deletedKindId] || deletedKindId === "Image")
//         return;
//       const deletedKind = state.kinds.entities[deletedKindId]!;

//       // Delete removed associated categories
//       const associatedCategories = deletedKind.categories;
//       categoriesAdapter.removeMany(state.categories, associatedCategories);

//       // Delete Associated annotations
//       const associatedAnnotations = deletedKind.containing;

//       for (const annId of associatedAnnotations) {
//         const annotation = state.things.entities[annId] as AnnotationObject;
//         const TSAnnotation = state.annotations.entities[
//           annId
//         ] as TSAnnotationObject;
//         dispose(annotation.data as TensorContainer);
//         dispose(TSAnnotation.data as TensorContainer);
//         thingsAdapter.removeOne(state.things, annId);
//         annotationsAdapter.removeOne(state.annotations, annId);
//         const image = state.things.entities[annotation.imageId] as ImageObject;
//         const TSImage = state.images.entities[annotation.imageId];
//         thingsAdapter.updateOne(state.things, {
//           id: annotation.imageId,
//           changes: {
//             containing: difference(image.containing, [annotation.id]),
//           },
//         });
//         imagesAdapter.updateOne(state.images, {
//           id: annotation.imageId,
//           changes: {
//             containing: difference(TSImage.containing, [annotation.id]),
//           },
//         });
//       }

//       kindsAdapter.removeOne(state.kinds, deletedKindId);
//     },
//     deleteKinds(state, action: PayloadAction<{ kindIds: string[] }>) {
//       const { kindIds } = action.payload;
//       for (const kindId of kindIds) {
//         dataSlice.caseReducers.deleteKind(state, {
//           type: "deleteKind",
//           payload: { deletedKindId: kindId },
//         });
//       }
//     },
//     // Exclusively add categories to store. Unsafe because it does not:
//     // - Update kind's category list
//     // - Check for duplicates
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     addCategories_unsafe(
//       state,
//       action: PayloadAction<{
//         categories: Array<Category>;
//       }>,
//     ) {
//       const { categories } = action.payload;
//       categoriesAdapter.addMany(state.categories, categories);
//     },
//     addCategories(
//       state,
//       action: PayloadAction<{
//         categories: Array<Category>;
//       }>,
//     ) {
//       const { categories } = action.payload;
//       for (const category of categories) {
//         if (state.categories.ids.includes(category.id)) continue;

//         dataSlice.caseReducers.updateKindCategories(state, {
//           type: "updateKindCategories",
//           payload: {
//             changes: [
//               {
//                 kindId: category.kind,
//                 updateType: "add",
//                 categories: [category.id],
//               },
//             ],
//           },
//         });

//         categoriesAdapter.addOne(state.categories, category);
//       }
//     },
//     createCategory(
//       state,
//       action: PayloadAction<{
//         name: string;
//         color: string;
//         kind: string;
//       }>,
//     ) {
//       const { name, color, kind } = action.payload;

//       let kindsToUpdate = [];

//       if (kind === "all") {
//         kindsToUpdate = state.kinds.ids;
//       } else {
//         kindsToUpdate.push(kind);
//       }

//       let id = generateUUID();
//       let idIsUnique = !state.categories.ids.includes(id);

//       while (!idIsUnique) {
//         id = generateUUID();
//         idIsUnique = !state.categories.ids.includes(id);
//       }

//       categoriesAdapter.addOne(state.categories, {
//         id: id,
//         name: name,
//         color: color,
//         visible: true,
//         containing: [],
//         kind: kind,
//       } as Category);

//       kindsToUpdate.forEach((kind) =>
//         dataSlice.caseReducers.updateKindCategories(state, {
//           type: "updateKindCategories",
//           payload: {
//             changes: [
//               {
//                 kindId: kind as string,
//                 updateType: "add",
//                 categories: [id],
//               },
//             ],
//           },
//         }),
//       );
//     },
//     updateCategories_unsafe(
//       state,
//       action: PayloadAction<{
//         updates: Array<{ id: string; changes: Omit<Partial<Category>, "id"> }>;
//       }>,
//     ) {
//       const { updates } = action.payload;
//       categoriesAdapter.updateMany(state.categories, updates);
//     },
//     updateCategory(
//       state,
//       action: PayloadAction<{
//         updates: CategoryUpdates;
//       }>,
//     ) {
//       const { updates } = action.payload;

//       const id = updates.id;

//       categoriesAdapter.updateOne(state.categories, {
//         id: id,
//         changes: updates,
//       });
//     },
//     updateCategoryContents(
//       state,
//       action: PayloadAction<{
//         changes: Array<{
//           categoryId: string;
//           updateType: "add" | "remove" | "replace";
//           contents: string[];
//         }>;
//       }>,
//     ) {
//       const { changes } = action.payload;
//       for (const { categoryId, contents, updateType } of changes) {
//         if (!state.categories.entities[categoryId]) continue;
//         const previousContents =
//           state.categories.entities[categoryId]!.containing;

//         const newContents = updateContents(
//           previousContents,
//           contents,
//           updateType,
//         );

//         categoriesAdapter.updateOne(state.categories, {
//           id: categoryId,
//           changes: { containing: newContents },
//         });
//       }
//     },

//     setCategories(
//       state,
//       action: PayloadAction<{
//         categories: Array<Category>;
//       }>,
//     ) {
//       const { categories } = action.payload;

//       dataSlice.caseReducers.deleteCategories(state, {
//         type: "deleteCategories",
//         payload: { categoryIds: "all" },
//       });
//       dataSlice.caseReducers.addCategories(state, {
//         type: "addCategories",
//         payload: {
//           categories: categories,
//         },
//       });
//     },
//     // Exclusively removes categories store. Unsafe because it does not:
//     // - Update kind's category list
//     // - Recategorize associated things
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     deleteCategories_unsafe(
//       state,
//       action: PayloadAction<{
//         categoryIds: string[] | "all";
//       }>,
//     ) {
//       let { categoryIds } = action.payload;
//       if (categoryIds === "all") {
//         categoryIds = state.categories.ids as string[];
//       }
//       const excludingUnknown = categoryIds.filter(
//         (id) => !isUnknownCategory(id),
//       );
//       categoriesAdapter.removeMany(state.categories, excludingUnknown);
//     },
//     deleteCategories(
//       state,
//       action: PayloadAction<{
//         categoryIds: string[] | "all";
//       }>,
//     ) {
//       let { categoryIds } = action.payload;
//       if (categoryIds === "all") {
//         categoryIds = state.categories.ids as string[];
//       }
//       const allAssociatedThingIds: Record<string, string[]> = {};
//       for (const categoryId of categoryIds) {
//         if (isUnknownCategory(categoryId)) continue;
//         const category = state.categories.entities[categoryId];
//         if (!category) continue;

//         // Remove Category From Kind
//         const associatedKind = state.kinds.entities[category.kind];
//         if (!associatedKind) {
//           throw new Error(`Unable to find Kind for category ${category.name}`);
//         }
//         const catIndex = associatedKind.categories.indexOf(category.id);
//         if (catIndex !== 1) associatedKind.categories.splice(catIndex, 1);

//         // Update Things
//         const kindUnknownCategory = associatedKind.unknownCategoryId;
//         const associatedThings = category.containing;
//         if (allAssociatedThingIds[kindUnknownCategory]) {
//           allAssociatedThingIds[kindUnknownCategory].push(...associatedThings);
//         } else {
//           allAssociatedThingIds[kindUnknownCategory] = associatedThings;
//         }

//         const existingThings =
//           state.categories.entities[kindUnknownCategory]!.containing;
//         categoriesAdapter.updateOne(state.categories, {
//           id: kindUnknownCategory,
//           changes: {
//             containing: [...existingThings, ...associatedThings],
//           },
//         });

//         //Update Images
//         Object.values(state.images.entities).forEach((image) => {
//           Object.values(image.timepoints).forEach((timePoint) => {
//             if (timePoint.categoryId === category.id) {
//               timePoint.categoryId = kindUnknownCategory;
//             }
//           });
//         });

//         //Update Annotations
//         Object.values(state.annotations.entities).forEach((annotation) => {
//           if (annotation.categoryId === category.id) {
//             annotation.categoryId = kindUnknownCategory;
//           }
//         });
//       }
//       Object.entries(allAssociatedThingIds).forEach(([categoryId, things]) => {
//         state.categories.entities[categoryId].containing.push(...things);
//       });
//       categoriesAdapter.removeMany(state.categories, categoryIds);
//     },
//     removeCategoriesFromKind(
//       state,
//       action: PayloadAction<{
//         categoryIds: string[] | "all";
//         kind: string;
//       }>,
//     ) {
//       //HACK: Should check for empty category. if category empty, delete completely
//       let categoryIds = action.payload.categoryIds;
//       const kindId = action.payload.kind;
//       const kind = state.kinds.entities[kindId]!;
//       if (categoryIds === "all") {
//         categoryIds = state.categories.ids as string[];
//       }

//       for (const categoryId of categoryIds) {
//         if (isUnknownCategory(categoryId)) continue;

//         dataSlice.caseReducers.updateKindCategories(state, {
//           type: "updateKindCategories",
//           payload: {
//             changes: [
//               {
//                 kindId: kindId,
//                 updateType: "remove",
//                 categories: [categoryId],
//               },
//             ],
//           },
//         });
//         const thingsOfKind = state.kinds.entities[kindId]!.containing;

//         const thingsOfCategory =
//           state.categories.entities[categoryId]!.containing;
//         const thingsToRemove = intersection(thingsOfKind, thingsOfCategory);

//         dataSlice.caseReducers.updateCategoryContents(state, {
//           type: "updateCategoryContents",
//           payload: {
//             changes: [
//               {
//                 categoryId: categoryId,
//                 updateType: "remove",
//                 contents: thingsToRemove,
//               },
//               {
//                 categoryId: state.kinds.entities[kindId]!.unknownCategoryId,
//                 updateType: "add",
//                 contents: thingsToRemove,
//               },
//             ],
//           },
//         });

//         const thingUpdates = thingsToRemove.map((thing) => ({
//           id: thing,
//           categoryId: state.kinds.entities[kindId]!.unknownCategoryId,
//         }));

//         dataSlice.caseReducers.updateThings(state, {
//           type: "updateThings",
//           payload: { updates: thingUpdates },
//         });
//       }
//       //Update Images
//       Object.values(state.images.entities).forEach((image) => {
//         Object.values(image.timepoints).forEach((timePoint) => {
//           if (categoryIds.includes(timePoint.categoryId)) {
//             timePoint.categoryId = kind.unknownCategoryId;
//           }
//         });
//       });

//       //Update Annotations
//       Object.values(state.annotations.entities).forEach((annotation) => {
//         if (categoryIds.includes(annotation.categoryId)) {
//           annotation.categoryId = kind.unknownCategoryId;
//         }
//       });
//     },

//     // Exclusively add annotations to store. Unsafe because it does not:
//     // - Update kind's containing list
//     // - Update category's containing list
//     // - Update image's containing list
//     // - Check for duplicates
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     dangerouslyAddTSAnnotations(
//       state,
//       action: PayloadAction<{
//         annotations: Array<TSAnnotationObject>;
//       }>,
//     ) {
//       const { annotations } = action.payload;

//       for (const readOnlyAnnotation of annotations) {
//         const annotation = { ...readOnlyAnnotation };
//         // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
//         annotationsAdapter.addOne(state.annotation, annotation);
//       }
//     },
//     addTSAnnotations(
//       state,
//       action: PayloadAction<{
//         annotations: Array<TSAnnotationObject | DecodedTSAnnotationObject>;
//       }>,
//     ) {
//       const { annotations } = action.payload;
//       const encodedAnnotations: TSAnnotationObject[] = [];
//       for (const annotation of annotations) {
//         if (state.things.ids.includes(annotation.id)) continue;

//         // uses "new Set()" to ensure no duplicates
//         state.images.entities[annotation.imageId].containing = [
//           ...new Set([
//             ...state.images.entities[annotation.imageId].containing,
//             annotation.id,
//           ]),
//         ];

//         if (annotation.decodedMask) {
//           (annotation as TSAnnotationObject).encodedMask = encode(
//             annotation.decodedMask,
//           );
//           delete annotation.decodedMask;
//         }
//         encodedAnnotations.push(annotation as TSAnnotationObject);
//       }
//       annotationsAdapter.addMany(state.annotations, encodedAnnotations);
//     },
//     addTSImage(
//       state,
//       action: PayloadAction<{
//         images: Array<TSImageObject>;
//       }>,
//     ) {
//       const { images } = action.payload;

//       imagesAdapter.addMany(state.images, images);
//     },
//     updateTSImages(state, action: PayloadAction<{ updates: ImageUpdates }>) {
//       const { updates } = action.payload;
//       for (const update of updates) {
//         const { id, timePoints, ...changes } = update;
//         const image = state.images.entities[id];
//         if (!image) {
//           throw new Error(
//             `Error updating images: Image with id ${id} not found.`,
//           );
//         }

//         Object.entries(changes).forEach((change) => {
//           //@ts-ignore typescript doesnt know that "changes" contains valid entried for TSImageObject
//           image[change[0]] = change[1];
//         });
//         const updatedTimePoints: Record<TPKey, ImageTimepointData> = {};

//         if (timePoints) {
//           Object.entries(timePoints).forEach(
//             (change: [string, Partial<ImageTimepointData>]) => {
//               // @ts-ignore : Error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
//               updatedTimePoints[change[0]] = {
//                 ...image.timepoints[change[0]],
//                 ...change[1],
//               };
//             },
//           );
//         }
//         image.timepoints = { ...image.timepoints, ...updatedTimePoints };
//       }
//     },
//     // Exclusively updates annotations in store. Unsafe because it does not:
//     // - Update category's containing list
//     // - Update image's containing list
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     dangerouslyUpdateTSAnnotations(
//       state,
//       action: PayloadAction<{ updates: AnnotationUpdates }>,
//     ) {
//       const { updates } = action.payload;
//       for (const update of updates) {
//         const { id, ...changes } = update;
//         const annotation = state.annotations.entities[id];
//         if (!annotation) {
//           throw new Error(
//             `Error updating annotations: Annotation with id ${id} not found.`,
//           );
//         }

//         Object.entries(changes).forEach((change) => {
//           //@ts-ignore typescript doesnt know that "changes" contains valid entried for TSAnnotationObject
//           annotation[change[0]] = change[1];
//         });
//       }
//     },

//     updateImages(
//       state,
//       action: PayloadAction<{
//         updates: ThingsUpdates;
//       }>,
//     ) {
//       const { updates } = action.payload;

//       for (const update of updates) {
//         const { id, ...changes } = update;

//         if (!state.things.ids.includes(id)) continue;

//         if ("categoryId" in changes) {
//           const oldCategory = state.things.entities[id]!.categoryId;

//           dataSlice.caseReducers.updateCategoryContents(state, {
//             type: "updateCategoryContents",
//             payload: {
//               changes: [
//                 {
//                   categoryId: oldCategory,
//                   updateType: "remove",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//           dataSlice.caseReducers.updateCategoryContents(state, {
//             type: "updateCategoryContents",
//             payload: {
//               changes: [
//                 {
//                   categoryId: changes.categoryId!,
//                   updateType: "add",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//         }
//         if ("kind" in changes) {
//           const oldKind = state.things.entities[id]!.kind;

//           dataSlice.caseReducers.updateKindContents(state, {
//             type: "updateKindContents",
//             payload: {
//               changes: [
//                 {
//                   kindId: oldKind,
//                   updateType: "remove",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//           dataSlice.caseReducers.updateKindContents(state, {
//             type: "updateKindContents",
//             payload: {
//               changes: [
//                 {
//                   kindId: changes.kind!,
//                   updateType: "add",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//         }

//         // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
//         thingsAdapter.updateOne(state.things, { id, changes });
//       }
//     },
//     updateThings(
//       state,
//       action: PayloadAction<{
//         updates: ThingsUpdates;
//       }>,
//     ) {
//       const { updates } = action.payload;

//       for (const update of updates) {
//         const { id, ...changes } = update;

//         if (!state.things.ids.includes(id)) continue;

//         if ("categoryId" in changes) {
//           const oldCategory = state.things.entities[id]!.categoryId;

//           dataSlice.caseReducers.updateCategoryContents(state, {
//             type: "updateCategoryContents",
//             payload: {
//               changes: [
//                 {
//                   categoryId: oldCategory,
//                   updateType: "remove",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//           dataSlice.caseReducers.updateCategoryContents(state, {
//             type: "updateCategoryContents",
//             payload: {
//               changes: [
//                 {
//                   categoryId: changes.categoryId!,
//                   updateType: "add",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//         }
//         if ("kind" in changes) {
//           const oldKind = state.things.entities[id]!.kind;

//           dataSlice.caseReducers.updateKindContents(state, {
//             type: "updateKindContents",
//             payload: {
//               changes: [
//                 {
//                   kindId: oldKind,
//                   updateType: "remove",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//           dataSlice.caseReducers.updateKindContents(state, {
//             type: "updateKindContents",
//             payload: {
//               changes: [
//                 {
//                   kindId: changes.kind!,
//                   updateType: "add",
//                   contents: [id],
//                 },
//               ],
//             },
//           });
//         }

//         // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
//         thingsAdapter.updateOne(state.things, { id, changes });
//       }
//     },
//     updateItemName(state, action: PayloadAction<{ id: string; name: string }>) {
//       const { id, name } = action.payload;

//       if (state.images.ids.includes(id)) {
//         const image = state.images.entities[id];
//         const annotationChanges: Array<{ id: string; name: string }> = [
//           { id, name },
//         ];
//         const containedAnnotationIds = image.containing;
//         containedAnnotationIds.forEach((containedId) => {
//           const containedAnnotation = state.annotations.entities[containedId];
//           if (!containedAnnotation) {
//             console.error(
//               `Image with id "${image.id}" contains non-existent annotation with id "${containedId}"`,
//             );
//             return;
//           }
//           const containedAnnotationName = containedAnnotation.name;
//           if (containedAnnotation.name.includes(image.name)) {
//             annotationChanges.push({
//               id: containedId,
//               name: containedAnnotationName.replace(image.name, name),
//             });
//           }
//           dataSlice.caseReducers.updateImages(state, {
//             type: "updateImages",
//             payload: { updates: [{ id, name }] },
//           });
//           dataSlice.caseReducers.dangerouslyUpdateTSAnnotations(state, {
//             type: "dangerouslyUpdateTSAnnotations",
//             payload: { updates: annotationChanges },
//           });
//         });
//       } else {
//         dataSlice.caseReducers.dangerouslyUpdateTSAnnotations(state, {
//           type: "dangerouslyUpdateTSAnnotations",
//           payload: { updates: [{ id, name }] },
//         });
//       }
//     },
//     // Exclusively updates image contents store. Unsafe because it does not:
//     // - Confirm existence (or lack thereof) of annotations
//     // Only use when you are sure the rest of the state is/will be updated correctly elsewhere
//     dangerouslyUpdateImageContents(
//       state,
//       action: PayloadAction<{
//         updates: Array<{
//           id: string;
//           changes: Omit<Partial<ImageObject>, "id">;
//         }>;
//       }>,
//     ) {
//       const { updates } = action.payload;
//       thingsAdapter.updateMany(state.things, updates);
//     },
//     updateImageContents(
//       state,
//       action: PayloadAction<{
//         changes: Array<{
//           imageId: string;
//           updateType: "add" | "remove" | "replace";
//           contents: string[];
//         }>;
//       }>,
//     ) {
//       const { changes } = action.payload;
//       for (const { imageId: imageId, contents, updateType } of changes) {
//         const image = state.images.entities[imageId] as TSImageObject;
//         if (!image) {
//           console.error(`No image with id: ${imageId}`);
//           continue;
//         }
//         const previousContents = image.containing;

//         const newContents = updateContents(
//           previousContents,
//           contents,
//           updateType,
//         );

//         // @ts-ignore : This is a hack to get the thing to be added to the state.things. error is because of "isDisposedInternally" in the tensor, but we will move away from tensors
//         thingsAdapter.updateOne(state.images, {
//           id: imageId,
//           changes: { containing: newContents },
//         });
//       }
//     },

//     dangerouslyDeleteAnnotations(
//       state,
//       action: PayloadAction<{ ids: string[] }>,
//     ) {
//       for (const id in action.payload.ids) {
//         const annotation = state.annotations.entities[id];
//         if (!annotation) {
//           throw new Error(
//             `Error deleting annotations: Annotation with the id of ${id} does not exist.`,
//           );
//         }
//         dispose(annotation.data as TensorContainer);
//         annotationsAdapter.removeOne(state.annotations, id);
//       }
//     },
//     deleteAnnotations(state, action: PayloadAction<{ ids: string[] }>) {
//       for (const id in action.payload.ids) {
//         const annotation = state.annotations.entities[id];
//         if (!annotation) {
//           throw new Error(
//             `Error deleting annotations: Annotation with the id of ${id} does not exist.`,
//           );
//         }

//         const associatedImageId = annotation.imageId;
//         mutatingFilter(
//           state.images.entities[associatedImageId].containing,
//           (_id) => _id === id,
//         );

//         dispose(annotation.data as TensorContainer);
//         annotationsAdapter.removeOne(state.annotations, id);
//       }
//     },
//     deleteImages(
//       state,
//       action: PayloadAction<{ images: { id: string; timePoint?: TPKey }[] }>,
//     ) {
//       const associatedAnnotations: string[] = [];
//       for (const imageDetails of action.payload.images) {
//         const image = state.images.entities[imageDetails.id];
//         if (!image) {
//           throw new Error(
//             `Error deleting annotations: Annotation with the id of ${imageDetails.id} does not exist.`,
//           );
//         }
//         if (!imageDetails.timePoint) {
//           associatedAnnotations.push(...image.containing);

//           Object.values(image.timepoints).forEach((timePoint) => {
//             dispose(timePoint.data as TensorContainer);
//             dispose(timePoint.colors as unknown as TensorContainer);
//           });

//           imagesAdapter.removeOne(state.images, imageDetails.id);
//         } else {
//           image.containing.forEach((annotationId) => {
//             const annotation = state.annotations.entities[annotationId]!;
//             if (annotation.timepoint === imageDetails.timePoint) {
//               associatedAnnotations.push(annotationId);
//             }
//           });
//         }
//       }
//       dataSlice.caseReducers.dangerouslyDeleteAnnotations(state, {
//         type: "dangerouslyDeleteAnnotations",
//         payload: { ids: associatedAnnotations },
//       });
//     },
//   },
// });
