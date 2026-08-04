import { createSelector } from "@reduxjs/toolkit";

import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";

import type { MeasurementsState, PlotDetail } from "../types";

export const selectActiveGroupId = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.activeGroup;
};

const selectObjectMeasurementGroups = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.objectGroups;
};

const selectImageMeasurementGroups = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.imageGroups;
};

export const selectMeasurementGroups = createSelector(
  selectObjectMeasurementGroups,
  selectImageMeasurementGroups,
  (objectGroups, imageGroups) => {
    return { ...objectGroups, ...imageGroups };
  },
);

export const selectActiveMeasurementGroup = createSelector(
  selectActiveGroupId,
  selectMeasurementGroups,
  (groupId, groupDict) => {
    if (!groupId) return;
    return groupDict[groupId];
  },
);

export const selectActiveMeasurements = createSelector(
  selectActiveMeasurementGroup,
  (group) => {
    if (!group) return [];
    const intensityMeasurements = group.intensityMeasurements.filter(
      (msrmnt) => !["intensity", ...CHANNEL_MEASUREMENT_KEYS].includes(msrmnt),
    );
    return [...group.computedMeasurements, ...intensityMeasurements];
  },
);

export const selectActivePivotItems = createSelector(
  selectActiveMeasurementGroup,
  (group) => {
    if (!group) return [];
    return group.pivotItems ?? [];
  },
);

export const selectActiveSelectedPlot = createSelector(
  selectActiveMeasurementGroup,
  (group): PlotDetail | undefined => {
    if (!group?.selectedPlotId) return;
    return group.plots[group.selectedPlotId];
  },
);

export const selectActivePlotIds = createSelector(
  selectActiveMeasurementGroup,
  (group): string[] => {
    if (!group) return [];
    return Object.keys(group.plots);
  },
);

export const selectRenderPlotName = createSelector(
  selectActiveMeasurementGroup,
  (group): ((plotId: string) => string) =>
    (plotId: string) => {
      const plot = group?.plots[plotId];
      if (!plot) return "";
      return plot.name;
    },
);
