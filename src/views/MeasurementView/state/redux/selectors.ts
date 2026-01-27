import { MeasurementsState, PlotDetail } from "../../types";
import { createSelector } from "@reduxjs/toolkit";
import { selectAnnotationEntities } from "store/data/selectors";

export const selectActiveGroupId = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.activeGroup;
};

export const selectObjectMeasurementGroups = ({
  measurements,
}: {
  measurements: MeasurementsState;
}) => {
  return measurements.objectGroups;
};

export const selectImageMeasurementGroups = ({
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

export const selectObjectMeasurements = createSelector(
  selectObjectMeasurementGroups,
  selectAnnotationEntities,
  (groups, objects) => {
    const groupArr = Object.values(groups);
    if (groupArr.length === 0) return;
    const group = groupArr[0];
    const splits = group.splits;
    const measurements = group.computedMeasurements;
    const rows: Record<string, Record<string, number[]>> = {};
    group.entityIds.forEach((id) => {
      const object = objects[id];
      measurements.forEach((measurement) => {
        if (measurement === "com") return;
        if (object.measurements && object.measurements[measurement]) {
          rows[measurement] = {
            all: [object.measurements[measurement]],
          };
          if (splits.category && splits.category.includes(object.categoryId)) {
            if (rows[measurement][object.categoryId]) {
              rows[measurement][object.categoryId].push(
                object.measurements[measurement],
              );
            } else
              rows[measurement][object.categoryId] = [
                object.measurements[measurement],
              ];
          }
          if (splits.partition && splits.partition.includes(object.partition)) {
            if (rows[measurement][object.partition]) {
              rows[measurement][object.partition].push(
                object.measurements[measurement],
              );
            } else
              rows[measurement][object.partition] = [
                object.measurements[measurement],
              ];
          }
        }
      });
    });
    return rows;
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
