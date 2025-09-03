import { useDispatch, useSelector } from "react-redux";

import { selectActiveCategories } from "store/project/reselectors";
import { selectActiveKindItemFilters } from "store/project/selectors";
import { useCallback, useMemo } from "react";
import { projectSlice } from "store/project";
import { Category } from "store/data/types";
import { FilterList } from "./FilterList";

export const CategoryFilterList = () => {
  const dispatch = useDispatch();
  const thingFilters = useSelector(selectActiveKindItemFilters);
  const activeCategories = useSelector(selectActiveCategories);
  const filteredCategories = useMemo(
    () => thingFilters.categoryId ?? [],
    [thingFilters.categoryId],
  );

  const toggleImageCategoryFilter = useCallback(
    (category: Category) => {
      if (
        thingFilters.categoryId &&
        thingFilters.categoryId.includes(category.id)
      ) {
        dispatch(
          projectSlice.actions.removeKindItemCategoryFilters({
            categoryIds: [category.id],
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.addKindItemCategoryFilters({
            categoryIds: [category.id],
          }),
        );
      }
    },
    [dispatch, thingFilters.categoryId],
  );

  const toggleAllImageCategoryFilter = useCallback(
    (filtered: boolean) => {
      if (filtered) {
        dispatch(
          projectSlice.actions.addKindItemCategoryFilters({
            categoryIds: activeCategories.map((category) => category.id),
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.removeKindItemCategoryFilters({
            categoryIds: activeCategories.map((category) => category.id),
          }),
        );
      }
    },
    [dispatch, filteredCategories, activeCategories],
  );

  return (
    <FilterList
      title="Filter Category"
      tooltipContent="categories"
      items={activeCategories}
      onToggle={toggleImageCategoryFilter}
      onToggleAll={toggleAllImageCategoryFilter}
      isFiltered={(category) => {
        if (category === "all") {
          return filteredCategories.length === activeCategories.length;
        } else if (category === "any") {
          return filteredCategories.length === 0;
        }
        return filteredCategories.includes(category.id);
      }}
    />
  );
};
