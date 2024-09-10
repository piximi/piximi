import { createSelector } from "@reduxjs/toolkit";
import { selectMeasurementData, selectMeasurementGroups } from "./selectors";
import {
  selectCategoriesDictionary,
  selectKindDictionary,
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

export const selectTablesMeasurementTableData = createSelector(
  selectMeasurementData,
  selectMeasurementGroups,
  selectThingsDictionary,
  selectKindDictionary,
  (measurementData, tables, things, kinds) => {
    const rtables: GroupedMeasurementDisplayTable[] = [];
    Object.values(tables).forEach((table) => {
      const groupedTable: GroupedMeasurementDisplayTable = {
        id: table.id,
        kind: table.kind,
        title: table.name,
        measurements: {},
        thingIds: table.thingIds,
      };

      const thingsOfKind = table.thingIds.map((thingId) => things[thingId]);

      Object.values(table.measurementsStatus).forEach((measurement) => {
        if (measurement.state === "on") {
          const rows: DisplayTableRow[] = [];
          Object.values(table.splitStatus).forEach((split) => {
            if (split.state === "on") {
              const splitThings = thingsOfKind.reduce(
                (ids: string[], thing) => {
                  if (
                    (
                      thing[split.parent! as string as keyof Thing] as string
                    ).toLowerCase() === split.id.toLowerCase()
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
            tableId: table.id,
            measurementId: measurement.id,
            splits: rows,
          };
        }
      });
      rtables.push(groupedTable);
    });

    return rtables;
  }
);

const getSplitType = (split: MeasurementOption) => {
  if (split.parent === "partition") {
    return { partition: split.name as Partition };
  } else if (split.parent === "categoryId") {
    return { category: split.name };
  }
};
