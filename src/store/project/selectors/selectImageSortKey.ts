import { createSelector } from "@reduxjs/toolkit";
import { selectImageSortKey, selectSortTypeNew } from "../selectors";
import { selectCategoriesDictionary } from "store/data/selectors/selectors";
import { Thing } from "store/data/types";
import { sortTypeByKey } from "utils/common/helpers";
import { ThingSortKey_new } from "utils/common/enums";

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
          comparerFunction: (a: Thing, b: Thing) =>
            a.name.localeCompare(b.name),
          objectType: "Images",
        };
      case ThingSortKey_new.Category:
        return {
          imageSortKeyName: "Category",
          imageSortKey: ThingSortKey_new.Category,
          comparerFunction: (a: Thing, b: Thing) =>
            categoryDict[a.categoryId].name.localeCompare(
              categoryDict[b.categoryId].name
            ),
          objectType: "All",
        };
      case ThingSortKey_new.Random:
        return {
          imageSortKeyName: "Random",
          imageSortKey: ThingSortKey_new.Random,
          comparerFunction: (a: Thing, b: Thing) =>
            Math.round(Math.random() * 10) >= 5 ? 1 : -1,
          objectType: "All",
        };
      case ThingSortKey_new.Name:
        return {
          imageSortKeyName: "Name",
          imageSortKey: ThingSortKey_new.Name,
          comparerFunction: (a: Thing, b: Thing) =>
            a.name.localeCompare(b.name),
          objectType: "Annotations",
        };
      case ThingSortKey_new.None:
      default:
        return {
          imageSortKeyName: "None",
          imageSortKey: ThingSortKey_new.None,
          comparerFunction: (a: Thing, b: Thing) => 0,
          objectType: "All",
        };
    }
  }
);
