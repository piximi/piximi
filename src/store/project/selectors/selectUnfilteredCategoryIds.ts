import { createSelector } from "@reduxjs/toolkit";
import { selectActiveThingFilters } from "../selectors";
import { selectActiveCategories } from "store/data/selectors/reselectors";
import { difference } from "lodash";

export const selectUnfilteredActiveCategoryIds = createSelector(
  selectActiveThingFilters,
  selectActiveCategories,
  (thingFilters, activeCategories) => {
    const filteredCategories = thingFilters.categoryId;
    const unfilteredCategories = difference(
      activeCategories.map((cat) => cat.id),
      filteredCategories
    );
    return unfilteredCategories;
  }
);
