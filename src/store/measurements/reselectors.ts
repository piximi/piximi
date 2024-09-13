import { createSelector } from "@reduxjs/toolkit";
import { selectMeasurementData, selectMeasurementGroups } from "./selectors";
import {
  selectCategoriesDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import {
  DisplayTableRow,
  GroupedMeasurementDisplayTable,
  MeasurementOption,
  ParsedMeasurementData,
} from "./types";
import { Thing } from "store/data/types";
import { capitalize } from "utils/common/helpers";
import { Partition } from "utils/models/enums";
import { getStatistics } from "utils/measurements/helpers";

export const selectPlotData = createSelector(
  selectMeasurementData,
  selectThingsDictionary,
  selectCategoriesDictionary,
  (measurementData, things, categories) => {
    const parsedMeasurementData: ParsedMeasurementData = {};

    Object.keys(measurementData).forEach((thingId) => {
      const thing = things[thingId];
      parsedMeasurementData[thingId] = {
        id: thingId,
        kind: thing.kind,
        category: categories[thing.categoryId].name,
        partition: thing.partition,
        measurements: measurementData[thingId].measurements,
      };
    });

    return parsedMeasurementData;
  }
);

export const selectGroupMeasurementDisplayData = createSelector(
  selectMeasurementData,
  selectMeasurementGroups,
  selectThingsDictionary,
  (measurementData, groups, things) => {
    const rGroups: GroupedMeasurementDisplayTable[] = [];
    Object.values(groups).forEach((group) => {
      const groupedTable: GroupedMeasurementDisplayTable = {
        id: group.id,
        kind: group.kind,
        title: group.name,
        measurements: {},
        thingIds: group.thingIds,
      };

      const thingsOfKind = group.thingIds.map((thingId) => things[thingId]);

      Object.values(group.measurementsStatus).forEach((measurement) => {
        if (!measurement.children && measurement.state === "on") {
          const rows: DisplayTableRow[] = [];
          Object.values(group.splitStatus).forEach((split) => {
            if (split.state === "on" && split.parent) {
              const splitThings = thingsOfKind.reduce(
                (ids: string[], thing) => {
                  const parent = thing[split.parent! as keyof Thing] as string;
                  if (
                    parent &&
                    parent.toLowerCase() === split.id.toLowerCase()
                  ) {
                    ids.push(thing.id);
                  }
                  return ids;
                },
                []
              );

              if (splitThings.length === 0) {
                if (split.parent)
                  rows.push({
                    split: `${capitalize(split.parent ?? "")} - ${split.name}`,
                    ...getSplitType(split),
                    mean: "N/A",
                    std: "N/A",
                    median: "N/A",
                  });
              } else {
                const measuredValues = splitThings.map(
                  (thingId) =>
                    measurementData[thingId].measurements[measurement.id]
                );
                const stats = getStatistics(measuredValues);

                if (split.parent)
                  rows.push({
                    split: `${capitalize(split.parent ?? "")} - ${split.name}`,
                    ...getSplitType(split),
                    mean: stats.mean,
                    std: stats.std,
                    median: stats.median,
                  });
              }
            }
          });
          const groupName = capitalize(measurement.id.replaceAll("-", " "));
          groupedTable.measurements[groupName] = {
            tableId: group.id,
            measurementId: measurement.id,
            splits: rows,
          };
        }
      });
      rGroups.push(groupedTable);
    });

    return rGroups;
  }
);

const getSplitType = (split: MeasurementOption) => {
  if (split.parent === "partition") {
    return { partition: split.name as Partition };
  } else if (split.parent === "categoryId") {
    return { category: split.name };
  }
};
