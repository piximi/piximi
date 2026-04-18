import { useDispatch, useSelector } from "react-redux";

import { selectActiveThingFilters } from "store/project/selectors";

import { Partition } from "utils/models/enums";
import { projectSlice } from "store/project";
import { useCallback, useMemo } from "react";
import { FilterList } from "./FilterList";

export const PartitionFilterList = () => {
  const dispatch = useDispatch();
  const thingFilters = useSelector(selectActiveThingFilters);

  const filteredPartitions = useMemo(
    () => thingFilters.partition ?? [],
    [thingFilters.partition],
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
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.addThingPartitionFilters({
            partitions: [partition],
          }),
        );
      }
    },
    [dispatch, thingFilters.partition],
  );
  const toggleAllPartitonFilter = useCallback(
    (filtered: boolean) => {
      if (filtered) {
        dispatch(
          projectSlice.actions.addThingPartitionFilters({
            partitions: "all",
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.removeThingPartitionFilters({
            partitions: "all",
          }),
        );
      }
    },
    [dispatch],
  );

  return (
    <FilterList
      title="Filter Partition"
      tooltipContent="partitions"
      items={Object.keys(Partition).map((partition) => partition as Partition)}
      onToggle={toggleThingPartition}
      onToggleAll={toggleAllPartitonFilter}
      isFiltered={(partition) => {
        if (partition === "all") {
          return filteredPartitions.length === Object.keys(Partition).length;
        } else if (partition === "any") {
          return filteredPartitions.length === 0;
        }
        return filteredPartitions.includes(partition as Partition);
      }}
    />
  );
};
