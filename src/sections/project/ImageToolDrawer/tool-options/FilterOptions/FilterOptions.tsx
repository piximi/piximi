import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "@mui/material";

import { CategoryFilterList } from "./CategoryFilterList";
import { PartitionFilterList } from "./PartitionFilterList";

import { selectActiveThingFilters } from "store/project/selectors";
import { projectSlice } from "store/project";

import { Partition } from "utils/models/enums";

export const FilterOptions = () => {
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
      <CategoryFilterList
        header="By Category"
        filteredCategories={thingFilters.categoryId ?? []}
        toggleFilter={toggleImageCategoryFilter}
      />
      <PartitionFilterList
        header="By Partition"
        filteredPartitions={thingFilters.partition ?? []}
        toggleFilter={toggleThingPartition}
      />
    </Stack>
  );
};
