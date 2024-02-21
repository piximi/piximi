import { createSelector } from "@reduxjs/toolkit";
import { selectActiveThingFilters } from "../selectors";
import { selectCategoriesInView } from "store/slices/newData/selectors/selectors";
import { difference } from "lodash";

export const selectUnfilteredActiveCategoryIds = createSelector(
  selectActiveThingFilters,
  selectCategoriesInView,
  (thingFilters, activeCategories) => {
    const filteredCategories = thingFilters.categoryId;
    const unfilteredCategories = difference(
      activeCategories.map((cat) => cat.id),
      filteredCategories
    );
    return unfilteredCategories;
  }
);
