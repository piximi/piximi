import { useCallback, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Collapse } from "@mui/material";

import { selectActiveViewState } from "@ProjectViewer/state/selectors";
import { projectSlice } from "@ProjectViewer/state";

import { Partition } from "utils/dl/enums";

import { FilterList } from "./FilterList";
import { SectionHeader } from "./SectionHeader";

export const PartitionFilterList = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveViewState);
  const [showFilters, setShowFilters] = useState(false);

  const filteredPartitions = useMemo(
    () => activeView.filters.partition,
    [activeView.filters.partition],
  );

  const dispatchOps = useMemo(
    () =>
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
          },
    [activeView],
  );

  const togglePartitionFilter = useCallback(
    (ptn: Partition) => {
      if (activeView.filters.partition.includes(ptn)) {
        dispatchOps.rem([ptn]);
      } else {
        dispatchOps.add([ptn]);
      }
    },
    [dispatchOps, activeView.filters.categoryId],
  );

  const toggleAllPartitionFilter = useCallback(
    (filtered: boolean) => {
      if (filtered) {
        dispatchOps.add(Object.values(Partition));
      } else {
        dispatchOps.rem(Object.values(Partition));
      }
    },
    [dispatchOps],
  );

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
