import { SelectionTreeItem, MeasurementsState } from "./types";
import { createSelector } from "@reduxjs/toolkit";

import { intersection } from "lodash";

export const selectMeasurementData = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.measurementData;
};

export const selectMeasurementTables = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.tables;
};

const findSelected = (
  parents: SelectionTreeItem[],
  selectedMeasurements: string[]
) => {
  parents.forEach((parent) => {
    const containedChildren = intersection(
      parent.children!,
      selectedMeasurements
    );
    if (
      containedChildren.length === parent.children!.length &&
      !selectedMeasurements.includes(parent.id)
    ) {
      selectedMeasurements.push(parent.id);
      findSelected(parents, selectedMeasurements);
    }
  });
};
export const selectSelectedTableMeasurements = createSelector(
  selectMeasurementTables,
  (tables) => (tableId: string) => {
    const selectedMeasurements: string[] = [];
    const table = tables[tableId];
    const tableMeasurements = Object.values(table.measurementsStatus);

    const parents = tableMeasurements.filter(
      (measurement) => measurement.children && measurement.children.length
    );

    tableMeasurements.forEach((measurement) => {
      if (measurement.state === "on") {
        selectedMeasurements.push(measurement.id);
      }
    });

    findSelected(parents, selectedMeasurements);

    return selectedMeasurements;
  }
);
export const selectSelectedTableSplits = createSelector(
  selectMeasurementTables,
  (tables) => (tableId: string) => {
    const selectedSplits: string[] = [];
    const table = tables[tableId];
    const tableSplits = Object.values(table.splitStatus);

    const parents = tableSplits.filter(
      (split) => split.children && split.children.length
    );

    tableSplits.forEach((split) => {
      if (split.state === "on") {
        selectedSplits.push(split.id);
      }
    });

    findSelected(parents, selectedSplits);

    return selectedSplits;
  }
);
