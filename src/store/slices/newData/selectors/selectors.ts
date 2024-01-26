import { createSelector } from "@reduxjs/toolkit";
import {
  kindsAdapter,
  categoriesAdapter,
  thingsAdapter,
} from "../newDataSlice";
import { RootState } from "store/rootReducer";

const kindsSelectors = kindsAdapter.getSelectors(
  (state: RootState) => state.newData.kinds
);
export const selectKindDictionary = kindsSelectors.selectEntities; // returns kinds dict
export const selectAllKinds = kindsSelectors.selectAll; // returns an array
export const selectAllKindIds = kindsSelectors.selectIds;
export const selectTotalKindCount = kindsSelectors.selectTotal;

const thingsSelectors = thingsAdapter.getSelectors(
  (state: RootState) => state.newData.things
);
export const selectThingsDictionary = thingsSelectors.selectEntities; // returns dict
export const selectAllThings = thingsSelectors.selectAll; // returns an array
export const selectAllThingIds = thingsSelectors.selectIds;
export const selectTotalThingCount = thingsSelectors.selectTotal;

const categorySelectors = categoriesAdapter.getSelectors(
  (state: RootState) => state.newData.categories
);
export const selectCategoriesDictionary = categorySelectors.selectEntities; // returns dict
export const selectAllCategories = categorySelectors.selectAll; // returns an array
export const selectAllCategoryIds = categorySelectors.selectIds;
export const selectTotalCategoryCount = categorySelectors.selectTotal;

export const selectThingsOfKind = createSelector(
  [selectKindDictionary, selectThingsDictionary],
  (kindDict, thingDict) => (kind: string) => {
    const thingsOfKind = kindDict[kind].containing;
    return thingsOfKind.map((thingId) => thingDict[thingId]);
  }
);
