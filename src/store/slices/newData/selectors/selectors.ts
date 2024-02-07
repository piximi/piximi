import { createSelector } from "@reduxjs/toolkit";
import {
  kindsAdapter,
  categoriesAdapter,
  thingsAdapter,
} from "../newDataSlice";
import { RootState } from "store/rootReducer";
import { NewCategory } from "types/Category";
import { selectActiveKind } from "store/slices/project/selectors";
import { intersection } from "lodash";

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
  (kindDict, thingDict) => {
    return (kind: string) => {
      const thingsOfKind = kindDict[kind].containing;
      return thingsOfKind.map((thingId) => thingDict[thingId]);
    };
  }
);
export const selectCategoriesOfKind = createSelector(
  [selectKindDictionary, selectCategoriesDictionary],
  (kindDict, categoriesDict) => {
    return (kind: string) => {
      const categoriesOfKind = kindDict[kind].categories;
      return categoriesOfKind.map((catId) => categoriesDict[catId]);
    };
  }
);
export const selectCategoriesInView = createSelector(
  [selectKindDictionary, selectCategoriesDictionary, selectActiveKind],
  (kindDict, categoriesDict, kind) => {
    console.log(kindDict);
    console.log(kind);
    const categoriesOfKind = kindDict[kind].categories;
    return categoriesOfKind.map((catId) => categoriesDict[catId]);
  }
);

export const selectThingsInView = createSelector(
  [selectKindDictionary, selectThingsDictionary, selectActiveKind],
  (kindDict, thingDict, kind) => {
    const thingsOfKind = kindDict[kind].containing;
    return thingsOfKind.map((thingId) => thingDict[thingId]);
  }
);

export const selectCategoryProperty = createSelector(
  selectCategoriesDictionary,
  (entities) =>
    <S extends keyof NewCategory>(id: string, property: S) => {
      const category = entities[id];
      if (!category) return;
      return category[property];
    }
);
export const selectNumThingsOfCatAndKind = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  (kindDict, catDict) => (catId: string, kind: string) => {
    const thingsOfKind = kindDict[kind].containing;
    const thingsOfCat = catDict[catId].containing;

    return intersection(thingsOfCat, thingsOfKind).length;
  }
);
