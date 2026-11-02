import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Collapse } from "@mui/material";

import { Partition } from "core/dl/enums";

import { selectActiveViewState } from "@ProjectViewer/state/selectors";
import { projectSlice } from "@ProjectViewer/state";

import { FilterList } from "./FilterList";
import { SectionHeader } from "./SectionHeader";

export const PartitionFilterList = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveViewState);
  const [showFilters, setShowFilters] = useState(false);

  const filteredPartitions = activeView.filters.partition;

  const dispatchOps =
    activeView.view === "images"
      ? {
          add: (ptns: Partition[]) =>
            dispatch(projectSlice.actions.addImagePartitionFilters(ptns)),
          rem: (ptns: Partition[]) =>
            dispatch(projectSlice.actions.removeImagePartitionFilters(ptns)),
        }
      : {
          add: (ptns: Partition[]) =>
            dispatch(
              projectSlice.actions.addAnnotationPartitionFilters({
                kindId: activeView.id,
                ids: ptns,
              }),
            ),
          rem: (ptns: Partition[]) =>
            dispatch(
              projectSlice.actions.removeAnnotationPartitionFilters({
                kindId: activeView.id,
                ids: ptns,
              }),
            ),
        };

  const togglePartitionFilter = (ptn: Partition) => {
    if (activeView.filters.partition.includes(ptn)) {
      dispatchOps.rem([ptn]);
    } else {
      dispatchOps.add([ptn]);
    }
  };

  const toggleAllPartitionFilter = (filtered: boolean) => {
    if (filtered) {
      dispatchOps.add(Object.values(Partition));
    } else {
      dispatchOps.rem(Object.values(Partition));
    }
  };

  const isItemFiltered = (partition: Partition) => {
    return filteredPartitions.includes(partition);
  };
  const allFiltered =
    filteredPartitions.length === Object.keys(Partition).length;
  const noneFiltered = filteredPartitions.length === 0;

  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SectionHeader
        title="Partition Filters"
        onExpand={() => setShowFilters((v) => !v)}
        hasActiveFilters={!noneFiltered}
        expanded={showFilters}
      />

      <Collapse in={showFilters}>
        <FilterList
          items={Object.keys(Partition).map(
            (partition) => partition as Partition,
          )}
          onToggle={togglePartitionFilter}
          onToggleAll={toggleAllPartitionFilter}
          allFiltered={allFiltered}
          noneFiltered={noneFiltered}
          isFiltered={isItemFiltered}
          getId={(i) => i}
          getName={(i) => i}
          getColor={(_i) => undefined}
        />
      </Collapse>
    </Box>
  );
};
