import { createSelector } from "@reduxjs/toolkit";
import { ThingSortKey_new, sortTypeByKey } from "types/ImageSortType";
import { selectImageSortKey, selectSortTypeNew } from "../selectors";
import { ThingType } from "types/ThingType";
import { selectCategoriesDictionary } from "store/slices/newData/selectors/selectors";

export const selectImageSortType = createSelector(
  selectImageSortKey,
  (sortKey) => {
    return sortTypeByKey(sortKey);
  }
);

export const selectThingSortType_new = createSelector(
  selectSortTypeNew,
  selectCategoriesDictionary,
  (sortType, categoryDict) => {
    switch (sortType) {
      case ThingSortKey_new.FileName:
        return {
          imageSortKeyName: "File name",
          imageSortKey: ThingSortKey_new.FileName,
          comparerFunction: (a: ThingType, b: ThingType) =>
            a.name.localeCompare(b.name),
          objectType: "Images",
        };
      case ThingSortKey_new.Category:
        return {
          imageSortKeyName: "Category",
          imageSortKey: ThingSortKey_new.Category,
          comparerFunction: (a: ThingType, b: ThingType) =>
            categoryDict[a.categoryId].name.localeCompare(
              categoryDict[b.categoryId].name
            ),
          objectType: "All",
        };
      case ThingSortKey_new.Random:
        return {
          imageSortKeyName: "Random",
          imageSortKey: ThingSortKey_new.Random,
          comparerFunction: (a: ThingType, b: ThingType) =>
            Math.round(Math.random() * 10) >= 5 ? 1 : -1,
          objectType: "All",
        };
      case ThingSortKey_new.Name:
        return {
          imageSortKeyName: "Name",
          imageSortKey: ThingSortKey_new.Name,
          comparerFunction: (a: ThingType, b: ThingType) =>
            a.name.localeCompare(b.name),
          objectType: "Annotations",
        };
      case ThingSortKey_new.None:
      default:
        return {
          imageSortKeyName: "None",
          imageSortKey: ThingSortKey_new.None,
          comparerFunction: (a: ThingType, b: ThingType) => 0,
          objectType: "All",
        };
    }
  }
);
