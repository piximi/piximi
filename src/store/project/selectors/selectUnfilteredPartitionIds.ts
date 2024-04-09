import { createSelector } from "@reduxjs/toolkit";
import { selectActiveThingFilters } from "../selectors";
import { difference } from "lodash";
import { Partition } from "utils/models/enums";

export const selectUnfilteredActivePartitions = createSelector(
  selectActiveThingFilters,
  (thingFilters) => {
    const filteredPartitions = thingFilters.partition;
    const allPartitions = Object.values(Partition);
    const unfilteredPartitions = difference(allPartitions, filteredPartitions);
    return unfilteredPartitions;
  }
);
