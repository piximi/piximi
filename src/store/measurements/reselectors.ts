import { createSelector } from "@reduxjs/toolkit";
import { selectMeasurementData, selectMeasurementTables } from "./selectors";
import {
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import {
  DisplayTableColumn,
  DisplayTableRow,
  GroupedMeasurementDisplayTable,
} from "./types";
import { Thing } from "store/data/types";
import { capitalize } from "utils/common/helpers";

export const selectTablesMeasurementTableData = createSelector(
  selectMeasurementData,
  selectMeasurementTables,
  selectThingsDictionary,
  selectKindDictionary,
  (measurementData, tables, things, kinds) => {
    const rtables: GroupedMeasurementDisplayTable[] = [];
    Object.values(tables).forEach((table) => {
      const groupedTable: GroupedMeasurementDisplayTable = {
        id: table.id,
        title: table.name,
        measurements: {},
      };
      type NewType = DisplayTableColumn;

      const columns: NewType[] = [
        {
          id: "split",
          label: "Split",
          minWidth: 170,
          format: (value: number) => value.toFixed(2),
        },
        {
          id: "mean",
          label: "Mean",
          minWidth: 100,
          format: (value: number) => value.toFixed(2),
        },
        {
          id: "std",
          label: "Standard Deviation",
          minWidth: 100,
          format: (value: number) => value.toFixed(2),
        },
        {
          id: "median",
          label: "Median",
          minWidth: 100,
          align: "right",
          format: (value: number) => value.toFixed(2),
        },
      ];
      const thingsOfKind = kinds[table.kind].containing.map(
        (thingId) => things[thingId]
      );

      Object.values(table.measurementsStatus).forEach((measurement) => {
        if (measurement.state === "on") {
          type NewType = DisplayTableRow;

          const rows: NewType[] = [];
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
                    mean: "N/A",
                    std: "N/A",
                    median: "N/A",
                  });
              } else {
                const measuredValues = splitThings.map(
                  (thingId) => measurementData[thingId][measurement.id]
                );
                const stats = getStatistics(measuredValues);

                if (split.parent)
                  rows.push({
                    split: `${capitalize(split.parent ?? "")} - ${split.name}`,
                    mean: stats.mean,
                    std: stats.std,
                    median: stats.median,
                  });
              }
            }
          });
          const groupName = capitalize(measurement.id.replaceAll("-", " "));
          groupedTable.measurements[groupName] = {
            title: table.id,
            columns: columns,
            rows: rows,
          };
        }
      });
      rtables.push(groupedTable);
    });

    return rtables;
  }
);

const getMean = (values: number[]) => {
  return (
    values.reduce((sum: number, value) => {
      return sum + value;
    }, 0) / values.length
  );
};

const getMedian = (values: number[]) => {
  const middleIndex = values.length / 2;
  const flooredIndex = Math.floor(middleIndex);
  let median: number;
  if (flooredIndex === middleIndex) {
    median = (values[middleIndex - 1] + values[middleIndex]) / 2;
  } else {
    median = values[flooredIndex];
  }
  return median;
};

const getSTD = (values: number[], mean: number) => {
  const _std =
    values.reduce((sqsum: number, value) => {
      return sqsum + (value - mean) ** 2;
    }, 0) / values.length;

  return Math.sqrt(_std);
};

const getStatistics = (values: number[]) => {
  values.sort();
  const mean = getMean(values);
  const median = getMedian(values);
  const std = getSTD(values, mean);

  return { mean, median, std };
};
