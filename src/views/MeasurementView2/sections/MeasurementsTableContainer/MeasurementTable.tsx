import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { GridApiCommunity } from "@mui/x-data-grid/internals";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { channelMeasurementLabel2Values } from "views/MeasurementView2/utils";
import { selectActiveMeasuredEntitiesGroup } from "views/MeasurementView2/state/redux/reselectors";
import { SplitTree } from "./SplitTree";
import {
  DisplayTableRow,
  GroupedMeasurementDisplayTable,
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
} from "../../types";

import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { selectCategoryEntities } from "store/data/selectors";
import {
  AnnotationObject,
  Category,
  ComputedImageMeasurements,
  ComputedObjectMeasurements,
  ImageObject,
} from "store/data/types";

import { getStatistics } from "utils/measurements/utils";

type ExtendedDisplayTableRow = {
  id: number;
  measurement: string;
  count: number;
} & DisplayTableRow;

const format = (value: string | number) => {
  if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    return value;
  }
};
const columns: GridColDef[] = [
  {
    field: "split",
    headerName: "Split",
    headerAlign: "center",
    align: "center",
    minWidth: 150,
    editable: false,
    flex: 1,
  },
  {
    field: "measurement",
    headerName: "Measurement",
    headerAlign: "center",
    align: "center",
    minWidth: 150,
    editable: false,
    flex: 1,
  },

  {
    field: "count",
    headerName: "Count",
    headerAlign: "center",
    minWidth: 100,
    align: "center",
    editable: false,
    flex: 1,
  },
  {
    field: "mean",
    headerName: "Mean",
    headerAlign: "center",
    minWidth: 100,
    align: "center",
    editable: false,
    valueFormatter: format,
    flex: 1,
  },
  {
    field: "median",
    headerName: "Median",
    headerAlign: "center",
    minWidth: 100,
    align: "center",
    editable: false,
    valueFormatter: format,
    flex: 1,
  },
  {
    field: "std",
    headerName: "Standard Deviation",
    headerAlign: "center",
    minWidth: 160,
    align: "center",
    editable: false,
    valueFormatter: format,
    flex: 1,
  },
];

const getTalliedComputedMeasurements = (
  entities: AnnotationObject[] | ImageObject[],
  measurements:
    | (keyof ComputedObjectMeasurements)[]
    | (keyof ComputedImageMeasurements)[],

  splits: {
    category?: string[] | undefined;
    partition?: string[] | undefined;
  },
  categories: Record<string, Category>,
  tallys: Record<string, Record<string, number[]>>,
) => {
  measurements.forEach((measurement) => {
    tallys[measurement] = {};
    entities.forEach((entity) => {
      if (
        entity.measurements &&
        Object.hasOwn(entity.measurements, measurement)
      ) {
        const value =
          entity.measurements[measurement as keyof typeof entity.measurements];
        if (typeof value !== "number") return;
        if ("all" in tallys[measurement]) {
          tallys[measurement]["all"].push(value);
        } else {
          tallys[measurement] = {
            all: [value],
          };
        }
        if (splits.category && splits.category.includes(entity.categoryId)) {
          const categoryName = categories[entity.categoryId].name;
          if (tallys[measurement][categoryName]) {
            tallys[measurement][categoryName].push(value);
          } else tallys[measurement][categoryName] = [value];
        }
        if (splits.partition && splits.partition.includes(entity.partition)) {
          if (tallys[measurement][entity.partition]) {
            tallys[measurement][entity.partition].push(value);
          } else tallys[measurement][entity.partition] = [value];
        }
      }
    });
  });
};

const getTalliedIntensityMeasurements = (
  entities: AnnotationObject[] | ImageObject[],
  measurements: string[],
  splits: {
    category?: string[] | undefined;
    partition?: string[] | undefined;
  },
  categories: Record<string, Category>,
  tallys: Record<string, Record<string, number[]>>,
) => {
  measurements.forEach((measurementLabel) => {
    const { channelId, measurement } =
      channelMeasurementLabel2Values(measurementLabel);

    tallys[measurementLabel] = {};
    entities.forEach((entity) => {
      const channelData = entity.measurements?.channels.find(
        (channelData) => +channelData.channelId === channelId,
      );
      if (channelData && channelData[measurement]) {
        const value = channelData[measurement];

        if ("all" in tallys[measurementLabel]) {
          tallys[measurementLabel]["all"].push(value);
        } else {
          tallys[measurementLabel] = {
            all: [value],
          };
        }
        if (splits.category && splits.category.includes(entity.categoryId)) {
          const categoryName = categories[entity.categoryId].name;
          if (tallys[measurementLabel][categoryName]) {
            tallys[measurementLabel][categoryName].push(value);
          } else tallys[measurementLabel][categoryName] = [value];
        }
        if (splits.partition && splits.partition.includes(entity.partition)) {
          if (tallys[measurementLabel][entity.partition]) {
            tallys[measurementLabel][entity.partition].push(value);
          } else tallys[measurementLabel][entity.partition] = [value];
        }
      }
    });
  });
};

const getRows = (
  activeEntityGroup: ImageEntityMeasurementGroup | ObjectEntityMeasurementGroup,
  categories: Record<string, Category>,
) => {
  const splits = activeEntityGroup.splits;
  const computedMeasurements = activeEntityGroup.computedMeasurements;
  const intensityMeasurements = activeEntityGroup.intensityMeasurements.filter(
    (msrmnt) => !["intensity", ...CHANNEL_MEASUREMENT_KEYS].includes(msrmnt),
  );
  const tallys: Record<string, Record<string, number[]>> = {};
  getTalliedComputedMeasurements(
    activeEntityGroup.entities,
    computedMeasurements,
    splits,
    categories,
    tallys,
  );
  getTalliedIntensityMeasurements(
    activeEntityGroup.entities,
    intensityMeasurements,
    splits,
    categories,
    tallys,
  );
  const rows: ExtendedDisplayTableRow[] = [];

  Object.entries(tallys).forEach(([measurement, splits], idx1) => {
    Object.entries(splits).forEach(([split, values], idx2) => {
      const { mean, median, std } = getStatistics(values);
      rows.push({
        id: +`${idx1}${idx2}`,
        measurement,
        split,
        count: values.length,
        mean,
        median,
        std,
      });
    });
  });
  return rows;
};

export const MeasurementTable = ({
  table,
  gridApiRef,
}: {
  table: GroupedMeasurementDisplayTable;
  gridApiRef: React.MutableRefObject<GridApiCommunity | null>;
}) => {
  const activeEntityGroup = useSelector(selectActiveMeasuredEntitiesGroup);
  const categories = useSelector(selectCategoryEntities);

  const rows = useMemo(() => {
    if (!activeEntityGroup) return;
    return getRows(activeEntityGroup, categories);
  }, [categories, activeEntityGroup]);

  return (
    <Box
      data-id="measurementTable"
      sx={{
        display: "flex",
        maxWidth: "100%",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0, // ← Add this
        overflow: "hidden", // ← Add this
      }}
    >
      <PanelGroup direction="horizontal">
        <>
          <Panel id="sidebar" defaultSize={20}>
            <SplitTree kind={table.kind} table={table} />
          </Panel>

          <PanelResizeHandle
            style={{
              width: "8px",
            }}
          />
        </>
        <Panel id="plot" defaultSize={80}>
          <DataGrid
            apiRef={gridApiRef}
            data-help={HelpItem.MeasurementDataTable}
            rowSpacingType="border"
            autosizeOnMount
            autosizeOptions={{ expand: true, includeHeaders: true }}
            columns={columns}
            rows={rows}
            density="compact"
            sx={(theme) => ({
              bgcolor: theme.palette.background.paper,

              height: "100%",
              maxHeight: "100%",
              minHeight: 0,
            })}
          />
        </Panel>
      </PanelGroup>
    </Box>
  );
};
