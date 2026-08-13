import { useCallback, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Collapse } from "@mui/material";

import { selectActiveViewState } from "@ProjectViewer/state/selectors";
import { projectSlice } from "@ProjectViewer/state";
import type { Category } from "store/data/types";
import { selectAllCategories } from "store/data/selectors";

import { FilterList } from "./FilterList";
import { SectionHeader } from "./SectionHeader";

export const CategoryFilterList = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveViewState);
  const categories = useSelector(selectAllCategories);
  const [showFilters, setShowFilters] = useState(false);

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

  const isItemFiltered = (category: Category) => {
    return filteredCategories.includes(category.id);
  };
  const allFiltered = filteredCategories.length === activeCategories.length;
  const noneFiltered = filteredCategories.length === 0;

  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SectionHeader
        title="Category Filters"
        onExpand={() => setShowFilters((v) => !v)}
        hasActiveFilters={!noneFiltered}
        expanded={showFilters}
      />

      <Collapse in={showFilters}>
        <FilterList
          items={activeCategories}
          onToggle={toggleCategoryFilter}
          onToggleAll={toggleAllCategoryFilter}
          allFiltered={allFiltered}
          noneFiltered={noneFiltered}
          isFiltered={isItemFiltered}
          getId={(i) => i.id}
          getName={(i) => i.name}
          getColor={(i) => i.color}
        />
      </Collapse>
    </Box>
  );
};
