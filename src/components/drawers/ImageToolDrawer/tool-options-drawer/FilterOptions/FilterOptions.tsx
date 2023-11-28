import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "@mui/material";
import { FilterCategoriesList } from "./CategoryFilterList";
import { PartitionFilterList } from "./PartitionFilterList";
import {
  selectAnnotationCategoryEntities,
  selectImageCategoryEntities,
} from "store/slices/data";
import {
  selectImageFilters,
  selectAnnotationFilters,
  projectSlice,
} from "store/slices/project";
import { Partition } from "types";

export const FilterOptions = () => {
  const imageFilters = useSelector(selectImageFilters);
  const annotationFilters = useSelector(selectAnnotationFilters);
  const imageCategories = useSelector(selectImageCategoryEntities);
  const annotationCategories = useSelector(selectAnnotationCategoryEntities);
  const dispatch = useDispatch();

  const toggleImageCategoryFilter = useCallback(
    (categoryId: string) => {
      if (imageFilters.categoryId.includes(categoryId)) {
        dispatch(
          projectSlice.actions.removeImageCategoryFilters({
            categoryIds: [categoryId],
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addImageCategoryFilters({
            categoryIds: [categoryId],
          })
        );
      }
    },
    [dispatch, imageFilters.categoryId]
  );

  const toggleImagePartition = useCallback(
    (partition: Partition) => {
      if (imageFilters.partition.includes(partition)) {
        dispatch(
          projectSlice.actions.removeImagePartitionFilters({
            partitions: [partition],
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addImagePartitionFilters({
            partitions: [partition],
          })
        );
      }
    },
    [dispatch, imageFilters.partition]
  );

  const toggleAnnotationCategoryFilter = useCallback(
    (categoryId: string) => {
      if (annotationFilters.categoryId.includes(categoryId)) {
        dispatch(
          projectSlice.actions.removeAnnotationCategoryFilters({
            categoryIds: [categoryId],
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addAnnotationCategoryFilters({
            categoryIds: [categoryId],
          })
        );
      }
    },
    [dispatch, annotationFilters.categoryId]
  );

  const handleRemoveImageCategoryFilter = (categoryId: string) => {
    dispatch(
      projectSlice.actions.removeImageCategoryFilters({
        categoryIds: [categoryId],
      })
    );
  };

  const handleRemoveImagePartitionFilter = (partition: Partition) => {
    dispatch(
      projectSlice.actions.removeImagePartitionFilters({
        partitions: [partition],
      })
    );
  };

  const handleRemoveAnnotationCategoryFilter = (categoryId: string) => {
    dispatch(
      projectSlice.actions.removeAnnotationCategoryFilters({
        categoryIds: [categoryId],
      })
    );
  };

  return (
    <Stack maxWidth="100%">
      <FilterCategoriesList
        header="Image Categories"
        allCategories={imageCategories}
        filteredCategories={imageFilters.categoryId}
        toggleFilter={toggleImageCategoryFilter}
        removeFilter={handleRemoveImageCategoryFilter}
      />
      <PartitionFilterList
        header="Image Partitions"
        filteredPartitions={imageFilters.partition}
        toggleFilter={toggleImagePartition}
        removeFilter={handleRemoveImagePartitionFilter}
      />
      <FilterCategoriesList
        header="Annotation Categories"
        allCategories={annotationCategories}
        filteredCategories={annotationFilters.categoryId}
        toggleFilter={toggleAnnotationCategoryFilter}
        removeFilter={handleRemoveAnnotationCategoryFilter}
      />
    </Stack>
  );
};
