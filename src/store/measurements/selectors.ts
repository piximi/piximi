import { MeasurementsState } from "./types";
import { createSelector } from "@reduxjs/toolkit";

import { findSelected } from "utils/measurements/helpers";

export const selectMeasurementData = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.data;
};

export const selectMeasurementGroups = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.groups;
};

export const selectSelectedTableMeasurements = createSelector(
  selectMeasurementGroups,
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
  selectMeasurementGroups,
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
