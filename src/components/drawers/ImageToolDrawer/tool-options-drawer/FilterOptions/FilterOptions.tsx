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
      if (imageFilters.categoryId.length === 0) {
        dispatch(
          projectSlice.actions.addImageCategoryFilters({
            categoryIds: Object.keys(imageCategories).filter(
              (id) => id !== categoryId
            ),
          })
        );
      } else if (
        imageFilters.categoryId.length ===
          Object.keys(imageCategories).length - 1 &&
        !imageFilters.categoryId.includes(categoryId)
      ) {
        dispatch(
          projectSlice.actions.removeImageCategoryFilters({
            all: true,
          })
        );
      } else if (imageFilters.categoryId.includes(categoryId)) {
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
    [dispatch, imageFilters.categoryId, imageCategories]
  );

  const toggleImagePartition = useCallback(
    (partition: Partition) => {
      if (imageFilters.partition.length === 0) {
        dispatch(
          projectSlice.actions.addImagePartitionFilters({
            partitions: Object.values(Partition).filter(
              (_partition) => _partition !== partition
            ),
          })
        );
      } else if (
        imageFilters.partition.length === Object.values(Partition).length - 1 &&
        !imageFilters.partition.includes(partition)
      ) {
        dispatch(
          projectSlice.actions.removeImagePartitionFilters({ all: true })
        );
      } else if (imageFilters.partition.includes(partition)) {
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
      if (annotationFilters.categoryId.length === 0) {
        dispatch(
          projectSlice.actions.addAnnotationCategoryFilters({
            categoryIds: Object.keys(annotationCategories).filter(
              (id) => id !== categoryId
            ),
          })
        );
      } else if (
        annotationFilters.categoryId.length ===
          Object.keys(annotationCategories).length - 1 &&
        !annotationFilters.categoryId.includes(categoryId)
      ) {
        dispatch(
          projectSlice.actions.removeAnnotationCategoryFilters({
            all: true,
          })
        );
      } else if (annotationFilters.categoryId.includes(categoryId)) {
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
    [dispatch, annotationFilters.categoryId, annotationCategories]
  );

  const handleAddImageCategoryFilter = (categoryId: string) => {
    dispatch(
      projectSlice.actions.addImageCategoryFilters({
        categoryIds: [categoryId],
      })
    );
  };

  const handleAddImagePartitionFilter = (partition: Partition) => {
    dispatch(
      projectSlice.actions.addImagePartitionFilters({
        partitions: [partition],
      })
    );
  };

  const handleAddAnnotationCategoryFilter = (categoryId: string) => {
    dispatch(
      projectSlice.actions.addAnnotationCategoryFilters({
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
        addFilter={handleAddImageCategoryFilter}
      />
      <PartitionFilterList
        header="Image Partitions"
        filteredPartitions={imageFilters.partition}
        toggleFilter={toggleImagePartition}
        addFilter={handleAddImagePartitionFilter}
      />
      <FilterCategoriesList
        header="Annotation Categories"
        allCategories={annotationCategories}
        filteredCategories={annotationFilters.categoryId}
        toggleFilter={toggleAnnotationCategoryFilter}
        addFilter={handleAddAnnotationCategoryFilter}
      />
    </Stack>
  );
};
