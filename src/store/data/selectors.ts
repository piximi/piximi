import { createSelector } from "@reduxjs/toolkit";
import { intersection } from "lodash";

import {
  kindsAdapter,
  categoriesAdapter,
  thingsAdapter,
  imagesAdapter,
  annotationsAdapter,
} from "./dataSlice";
import { RootState } from "store/rootReducer";

import {
  AnnotationObject,
  Category,
  ImageGridObject,
  ImageObject,
  Kind,
  TSAnnotationObject,
} from "./types";
import { DataState } from "store/types";
import { updateRecordArray } from "utils/objectUtils";

const kindsSelectors = kindsAdapter.getSelectors(
  (state: RootState) => state.data.kinds,
);
const categorySelectors = categoriesAdapter.getSelectors(
  (state: RootState) => state.data.categories,
);
const thingsSelectors = thingsAdapter.getSelectors(
  (state: RootState) => state.data.things,
);
const imageSelectors = imagesAdapter.getSelectors(
  (state: RootState) => state.data.images,
);
const annotationSelectors = annotationsAdapter.getSelectors(
  (state: RootState) => state.data.annotations,
);

export const selectKindDictionary = kindsSelectors.selectEntities; // returns kinds dict
export const selectAllKinds = kindsSelectors.selectAll; // returns an array
export const selectAllKindIds = kindsSelectors.selectIds;

const selectAllCategories = categorySelectors.selectAll; // returns an array
export const selectCategoriesDictionary = categorySelectors.selectEntities; // returns dict

const selectAllThings = thingsSelectors.selectAll; // returns an array
export const selectThingsDictionary = thingsSelectors.selectEntities; // returns dict

//export const selectImageDictionary = imageSelectors.selectEntities; // returns dict
export const selectImageArray = imageSelectors.selectAll; // returns an array
//export const selectImageIds = imageSelectors.selectIds;
//export const selectImageCount = imageSelectors.selectTotal;

//export const selectAnnotationDictionary = annotationSelectors.selectEntities; // returns dict
const selectAnnotationArray = annotationSelectors.selectAll; // returns an array
//export const selectAnotationIds = annotationSelectors.selectIds;
//export const selectAnnotationCount = annotationSelectors.selectTotal;

export const selectDataState = ({ data }: { data: DataState }) => data;

export const selectDataProject = createSelector(
  selectAllKinds,
  selectAllCategories,
  selectAllThings,
  (kinds, categories, things) => {
    return { kinds, categories, things };
  },
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
  },
);

const selectAllObjects = createSelector(selectAllThings, (things) => {
  return things.filter((thing) => thing.kind !== "Image") as AnnotationObject[];
});

export const selectObjectDict = createSelector(
  selectAllObjects,
  (objects): Record<string, AnnotationObject> => {
    return objects.reduce((objDict: Record<string, AnnotationObject>, obj) => {
      objDict[obj.id] = obj;
      return objDict;
    }, {});
  },
);

export const selectRenderKindName = createSelector(
  selectKindDictionary,
  (kinds) => (kindId: string) => kinds[kindId].displayName,
);

/*
  THINGS
*/

export const selectAllImages = createSelector(selectAllThings, (things) => {
  return things.filter((thing) => thing.kind === "Image") as ImageObject[];
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
        thing,
      ) => {
        if (thing.kind === "Image") {
          splitDict.images[thing.id] = thing as ImageObject;
        } else {
          splitDict.objects[thing.id] = thing as AnnotationObject;
        }
        return splitDict;
      },
      { images: {}, objects: {} },
    );
  },
);

export const selectThingsOfKind = createSelector(
  [selectKindDictionary, selectThingsDictionary],
  (kindDict, thingDict) => {
    return (kind: string) => {
      const thingsOfKind = kindDict[kind]!.containing;
      return thingsOfKind.map((thingId) => thingDict[thingId]!);
    };
  },
);

export const selectNumThingsByCatAndKind = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  (kindDict, catDict) => (catId: string, kind: string) => {
    const thingsOfKind = kindDict[kind]!.containing;
    const thingsOfCat = catDict[catId]!.containing;

    return intersection(thingsOfCat, thingsOfKind).length;
  },
);

/*
  CATEGORIES
*/

export const selectCategoriesByKind = createSelector(
  [selectKindDictionary, selectCategoriesDictionary],
  (kindDict, categoriesDict) => {
    return (kind: string) => {
      const categoriesOfKind = kindDict[kind]!.categories;
      return categoriesOfKind.map((catId) => categoriesDict[catId]!);
    };
  },
);

export const selectUnknownImageCategory = createSelector(
  selectKindDictionary,
  (kinds) => {
    return kinds["Image"]!.unknownCategoryId;
  },
);

export const selectAllObjectCategories = createSelector(
  selectAllCategories,
  (categories) => {
    return categories.filter((category) => category.kind !== "Image");
  },
);

export const selectObjectCategoryDict = createSelector(
  selectAllObjectCategories,
  (categories) => {
    return categories.reduce((catDict: Record<string, Category>, c) => {
      catDict[c.id] = c;
      return catDict;
    }, {});
  },
);

export const selectCategoryProperty = createSelector(
  selectCategoriesDictionary,
  (entities) =>
    <S extends keyof Category>(id: string, property: S) => {
      const category = entities[id];
      if (!category) return;
      return category[property];
    },
);

export const selectImageByCategoryRecord = createSelector(
  selectImageArray,
  (images) => {
    const imageByCategoryReference: Record<
      string,
      Array<{ id: string; timePoint: number }>
    > = {};
    images.forEach((image) => {
      Object.entries(image.timepoints).forEach((timePoint) => {
        const category = timePoint[1].categoryId;
        updateRecordArray(imageByCategoryReference, category, {
          id: image.id,
          timePoint: +timePoint[0],
        });
      });
    });
    return imageByCategoryReference;
  },
);

export const selectAnnotationsByKind = createSelector(
  selectAnnotationArray,
  (annotations) => {
    const kindRecord: Record<string, TSAnnotationObject[]> = {};

    annotations.forEach((annotation) => {
      updateRecordArray(kindRecord, annotation.kind, annotation);
    });
    return kindRecord;
  },
);
// export const selectAnnotationsKindCategoryRecord = createSelector(
//   selectAnnotationArray,
//   (annotations) => {
//     const kindCategoryRecord: Record<string, Record<string, string[]>> = {};

//     annotations.forEach((annotation) => {
//       if (!(annotation.kind in kindCategoryRecord)) {
//         kindCategoryRecord[annotation.kind] = {
//           [annotation.categoryId]: [annotation.id],
//         };
//       } else if (
//         !(annotation.categoryId in kindCategoryRecord[annotation.kind])
//       ) {
//         kindCategoryRecord[annotation.kind][annotation.categoryId] = [
//           annotation.id,
//         ];
//       } else {
//         kindCategoryRecord[annotation.kind][annotation.categoryId].push(
//           annotation.id,
//         );
//       }
//     });
//     return kindCategoryRecord;
//   },
// );

// export const selectAnnotationsByImageTimePoint = createSelector(
//   selectAnnotationArray,
//   (annotations) => {
//     const byImageTimePoint: Record<string, Record<number, string[]>> = {};

//     annotations.forEach((annotation) => {
//       if (!(annotation.imageId in byImageTimePoint)) {
//         byImageTimePoint[annotation.imageId] = {
//           [annotation.timepoint]: [annotation.id],
//         };
//       } else if (
//         !(annotation.timepoint in byImageTimePoint[annotation.imageId])
//       ) {
//         byImageTimePoint[annotation.imageId][annotation.timepoint] = [
//           annotation.id,
//         ];
//       } else {
//         byImageTimePoint[annotation.imageId][annotation.timepoint].push(
//           annotation.id,
//         );
//       }
//     });
//     return byImageTimePoint;
//   },
// );

export const selectImageGridImages = createSelector(
  selectImageArray,
  (images) => {
    return images.reduce((images: ImageGridObject[], tsImage) => {
      const { timepoints, ...base } = tsImage;
      images.push({
        ...base,
        ...timepoints[0],
        timepoint: 0,
      } as ImageGridObject);
      return images;
    }, []);
  },
);
