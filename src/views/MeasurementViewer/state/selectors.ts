import { createSelector } from "@reduxjs/toolkit";

import { CHANNEL_MEASUREMENTS } from "store/dataV2/types";

import type {
  ImageMeasurementGroup,
  MeasurementsState,
  ObjectMeasurementGroup,
  PlotDetail,
} from "../types";

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
  (
    groupId,
    groupDict,
  ): ObjectMeasurementGroup | ImageMeasurementGroup | undefined => {
    if (!groupId) return;
    return groupDict[groupId];
  },
);

export const selectActiveMeasurements = createSelector(
  selectActiveMeasurementGroup,
  (group) => {
    if (!group) return [];
    const intensityMeasurements = group.intensityMeasurements.filter(
      (msrmnt) => !["intensity", ...CHANNEL_MEASUREMENTS].includes(msrmnt),
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
