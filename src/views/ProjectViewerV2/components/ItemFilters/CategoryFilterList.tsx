import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { selectActiveViewState } from "@ProjectViewer/state/selectors";
import { projectSlice } from "@ProjectViewer/state";
import type { Category } from "store/data/types";
import { selectAllCategories } from "store/dataV2/selectors";

import { FilterList } from "./FilterList";

export const CategoryFilterList = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveViewState);
  const categories = useSelector(selectAllCategories);

  const activeCategories = useMemo(() => {
    if (activeView.view === "images")
      return categories.filter((c) => c.type === "image");
    return categories.filter(
      (c) => c.type === "annotation" && c.kindId === activeView.id,
    );
  }, [categories, activeView]);
  const filteredCategories = useMemo(
    () => activeView.filters.categoryId,
    [activeView.filters.categoryId],
  );

  const dispatchOps = useMemo(
    () =>
      activeView.view === "images"
        ? {
            add: (cats: string[]) =>
              dispatch(projectSlice.actions.addImageCategoryFilters(cats)),
            rem: (cats: string[]) =>
              dispatch(projectSlice.actions.removeImageCategoryFilters(cats)),
          }
        : {
            add: (cats: string[]) =>
              dispatch(
                projectSlice.actions.addAnnotationCategoryFilters({
                  kindId: activeView.id,
                  ids: cats,
                }),
              ),
            rem: (cats: string[]) =>
              dispatch(
                projectSlice.actions.removeAnnotationCategoryFilters({
                  kindId: activeView.id,
                  ids: cats,
                }),
              ),
          },
    [activeView],
  );

  const toggleCategoryFilter = useCallback(
    (category: Category) => {
      if (activeView.filters.categoryId.includes(category.id)) {
        dispatchOps.rem([category.id]);
      } else {
        dispatchOps.add([category.id]);
      }
    },
    [dispatchOps, activeView.filters.categoryId],
  );

  const toggleAllCategoryFilter = useCallback(
    (filtered: boolean) => {
      if (filtered) {
        dispatchOps.add(activeCategories.map((category) => category.id));
      } else {
        dispatchOps.rem(activeCategories.map((category) => category.id));
      }
    },
    [dispatch, filteredCategories, activeCategories],
  );

  //TODO: This has something to do with how the chips appear
  const getFilterState = (category: any) => {
    if (category === "all") {
      return filteredCategories.length === activeCategories.length;
    } else if (category === "any") {
      return filteredCategories.length === 0;
    }
    return filteredCategories.includes(category.id);
  };

  return (
    <FilterList
      title="Filter Category"
      tooltipContent="categories"
      items={activeCategories}
      onToggle={toggleCategoryFilter}
      onToggleAll={toggleAllCategoryFilter}
      isFiltered={getFilterState}
    />
  );
};
