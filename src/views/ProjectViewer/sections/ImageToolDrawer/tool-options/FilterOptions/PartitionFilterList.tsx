import { useDispatch, useSelector } from "react-redux";

import { selectActiveKindItemFilters } from "store/project/selectors";

import { Partition } from "utils/models/enums";
import { projectSlice } from "store/project";
import { useCallback, useMemo } from "react";
import { FilterList } from "./FilterList";

export const PartitionFilterList = () => {
  const dispatch = useDispatch();
  const thingFilters = useSelector(selectActiveKindItemFilters);

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
          projectSlice.actions.removeKindItemPartitionFilters({
            partitions: [partition],
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.addKindItemPartitionFilters({
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
          projectSlice.actions.addKindItemPartitionFilters({
            partitions: "all",
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.removeKindItemPartitionFilters({
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
