import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "@mui/material";
import { CategoryFilterListNew } from "./CategoryFilterListNew";
import { projectSlice } from "store/project";
import { selectActiveThingFilters } from "store/project/selectors";
import { PartitionFilterListNew } from "./PartitionFilterListNew";
import { Partition } from "utils/models/enums";

export const FilterOptionsNew = () => {
  const thingFilters = useSelector(selectActiveThingFilters);
  const dispatch = useDispatch();

  const toggleImageCategoryFilter = useCallback(
    (categoryId: string) => {
      if (
        thingFilters.categoryId &&
        thingFilters.categoryId.includes(categoryId)
      ) {
        dispatch(
          projectSlice.actions.removeThingCategoryFilters({
            categoryIds: [categoryId],
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addThingCategoryFilters({
            categoryIds: [categoryId],
          })
        );
      }
    },
    [dispatch, thingFilters.categoryId]
  );

  const toggleThingPartition = useCallback(
    (partition: Partition) => {
      if (
        thingFilters.partition &&
        thingFilters.partition.includes(partition)
      ) {
        dispatch(
          projectSlice.actions.removeThingPartitionFilters({
            partitions: [partition],
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addThingPartitionFilters({
            partitions: [partition],
          })
        );
      }
    },
    [dispatch, thingFilters.partition]
  );

  return (
    <Stack maxWidth="100%">
      <CategoryFilterListNew
        header="By Category"
        filteredCategories={thingFilters.categoryId ?? []}
        toggleFilter={toggleImageCategoryFilter}
      />
      <PartitionFilterListNew
        header="By Partition"
        filteredPartitions={thingFilters.partition ?? []}
        toggleFilter={toggleThingPartition}
      />
    </Stack>
  );
};
