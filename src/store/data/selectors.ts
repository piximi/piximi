import { createSelector } from "@reduxjs/toolkit";
import { kindsAdapter, categoriesAdapter, thingsAdapter } from "./dataSlice";
import { RootState } from "store/rootReducer";
import { AnnotationObject, Category, ImageObject, Kind } from "./types";
import { intersection } from "lodash";

const kindsSelectors = kindsAdapter.getSelectors(
  (state: RootState) => state.data.kinds
);
const categorySelectors = categoriesAdapter.getSelectors(
  (state: RootState) => state.data.categories
);
const thingsSelectors = thingsAdapter.getSelectors(
  (state: RootState) => state.data.things
);

export const selectKindDictionary = kindsSelectors.selectEntities; // returns kinds dict
export const selectAllKinds = kindsSelectors.selectAll; // returns an array
export const selectAllKindIds = kindsSelectors.selectIds;
export const selectTotalKindCount = kindsSelectors.selectTotal;

export const selectCategoriesDictionary = categorySelectors.selectEntities; // returns dict
export const selectAllCategories = categorySelectors.selectAll; // returns an array
export const selectAllCategoryIds = categorySelectors.selectIds;
export const selectTotalCategoryCount = categorySelectors.selectTotal;
export const selectCategoryById = categorySelectors.selectById;

export const selectThingsDictionary = thingsSelectors.selectEntities; // returns dict
export const selectAllThings = thingsSelectors.selectAll; // returns an array
export const selectAllThingIds = thingsSelectors.selectIds;
export const selectTotalThingCount = thingsSelectors.selectTotal;

export const selectDataProject = createSelector(
  selectAllKinds,
  selectAllCategories,
  selectAllThings,
  (kinds, categories, things) => {
    return { kinds, categories, things };
  }
);

/*
  KINDS
*/

export const selectAllObjectKinds = createSelector(selectAllKinds, (kinds) => {
  return kinds.filter((kind) => kind.id !== "Image");
});

export const selectObjectKindDict = createSelector(
  selectAllObjectKinds,
  (kinds) => {
    return kinds.reduce((kindDict: Record<string, Kind>, kind) => {
      kindDict[kind.id] = kind;
      return kindDict;
    }, {});
  }
);

/*
  THINGS
*/

export const selectAllImages = createSelector(selectAllThings, (things) => {
  return things.filter((thing) => thing.kind === "Image") as ImageObject[];
});

export const selectAllObjects = createSelector(selectAllThings, (things) => {
  return things.filter((thing) => thing.kind !== "Image") as AnnotationObject[];
});

export const selectSplitThingDict = createSelector(
  selectAllThings,
  (things) => {
    return things.reduce(
      (
        splitDict: {
          images: Record<string, ImageObject>;
          objects: Record<string, AnnotationObject>;
        },
        thing
      ) => {
        if (thing.kind === "Image") {
          splitDict.images[thing.id] = thing as ImageObject;
        } else {
          splitDict.objects[thing.id] = thing as AnnotationObject;
        }
        return splitDict;
      },
      { images: {}, objects: {} }
    );
  }
);

export const selectThingsOfKind = createSelector(
  [selectKindDictionary, selectThingsDictionary],
  (kindDict, thingDict) => {
    return (kind: string) => {
      const thingsOfKind = kindDict[kind].containing;
      return thingsOfKind.map((thingId) => thingDict[thingId]);
    };
  }
);

export const selectNumThingsByCatAndKind = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  (kindDict, catDict) => (catId: string, kind: string) => {
    const thingsOfKind = kindDict[kind].containing;
    const thingsOfCat = catDict[catId].containing;

    return intersection(thingsOfCat, thingsOfKind).length;
  }
);

export const selectAnnotatedImages = createSelector(
  selectThingsOfKind,
  (thingsByKind) => {
    const images = thingsByKind("Image");
    return images.filter((image) => {
      if ("containing" in image) {
        return image.containing.length > 0;
      }
      return false;
    }) as ImageObject[];
  }
);

/*
  CATEGORIES
*/

export const selectUnknownCategoryByKind = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  (kindDict, catDict) => {
    return (kind: string) => {
      const unknownCatId = kindDict[kind].unknownCategoryId;
      return catDict[unknownCatId];
    };
  }
);

export const selectCategoriesByKind = createSelector(
  [selectKindDictionary, selectCategoriesDictionary],
  (kindDict, categoriesDict) => {
    return (kind: string) => {
      const categoriesOfKind = kindDict[kind].categories;
      return categoriesOfKind.map((catId) => categoriesDict[catId]);
    };
  }
);

export const selectAllImageCategories = createSelector(
  selectAllCategories,
  (categories) => {
    return categories.filter((category) => category.kind !== "Image");
  }
);

export const selectUnknownImageCategory = createSelector(
  selectKindDictionary,
  (kinds) => {
    return kinds["Image"]?.unknownCategoryId;
  }
);

export const selectAllObjectCategories = createSelector(
  selectAllCategories,
  (categories) => {
    return categories.filter((category) => category.kind !== "Image");
  }
);

export const selectObjectCategoryDict = createSelector(
  selectAllObjectCategories,
  (categories) => {
    return categories.reduce((catDict: Record<string, Category>, c) => {
      catDict[c.id] = c;
      return catDict;
    }, {});
  }
);

export const selectCategoryProperty = createSelector(
  selectCategoriesDictionary,
  (entities) =>
    <S extends keyof Category>(id: string, property: S) => {
      const category = entities[id];
      if (!category) return;
      return category[property];
    }
);

export const selectFirstUnknownCategory = createSelector(
  selectAllKinds,
  selectCategoriesDictionary,
  (kinds, catDict) => {
    if (kinds.length < 2) return;
    const unknownCatId = kinds[1].unknownCategoryId;
    return catDict[unknownCatId];
  }
);
