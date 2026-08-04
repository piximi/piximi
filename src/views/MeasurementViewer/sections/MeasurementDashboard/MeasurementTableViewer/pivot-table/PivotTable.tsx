import { useMemo } from "react";

import { useSelector } from "react-redux";

import { Box } from "@mui/material";
import type { GridColumnGroup } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { GridApiCommunity } from "@mui/x-data-grid/internals";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { selectActivePivotItems } from "@MeasurementViewer/state/selectors";
import { selectActiveMeasuredEntitiesGroup } from "@MeasurementViewer/state/reselectors";
import { parseChannelMeasurementLabel } from "@MeasurementViewer/utils";
import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { selectCategoryEntities } from "store/data/selectors";
import type { AnnotationObject, ImageObject } from "store/data/types";

import {
  generatePivotColumns,
  generatePivotRows,
  generateUniqueCompositeKeys,
} from "./pivotUtils";

import type {
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
} from "@MeasurementViewer/types";
import type { MeasurementGetter } from "./pivotUtils";

type EntityWithMeasurements = AnnotationObject | ImageObject;

/**
 * Creates measurement getter functions for all computed and intensity measurements.
 */
const createMeasurementGetters = (
  activeEntityGroup: ImageEntityMeasurementGroup | ObjectEntityMeasurementGroup,
): MeasurementGetter[] => {
  const getters: MeasurementGetter[] = [];

  // Computed measurements
  activeEntityGroup.computedMeasurements.forEach((measurement) => {
    getters.push({
      key: measurement,
      label: measurement,
      getValue: (entity: EntityWithMeasurements) => {
        if (!entity.measurements) return undefined;
        const value =
          entity.measurements.computed[
            measurement as keyof typeof entity.measurements.computed
          ];
        return typeof value === "number" ? value : undefined;
      },
    });
  });

  // Intensity measurements (excluding base keys)
  const intensityMeasurements = activeEntityGroup.intensityMeasurements.filter(
    (msrmnt) =>
      !["intensity", ...(CHANNEL_MEASUREMENT_KEYS as string[])].includes(
        msrmnt,
      ),
  );

  intensityMeasurements.forEach((measurementLabel) => {
    const { channelId, measurement } =
      parseChannelMeasurementLabel(measurementLabel);

    getters.push({
      key: measurementLabel,
      label: measurementLabel,
      getValue: (entity: EntityWithMeasurements) => {
        const channelData = entity.measurements.channel[channelId];
        return channelData?.[measurement];
      },
    });
  });

  return getters;
};

export const PivotTable = ({
  gridApiRef,
}: {
  gridApiRef: React.MutableRefObject<GridApiCommunity | null>;
}) => {
  const activeEntityGroup = useSelector(selectActiveMeasuredEntitiesGroup);
  const pivotItems = useSelector(selectActivePivotItems);
  const categories = useSelector(selectCategoryEntities);

  // Generate composite keys based on pivot configuration
  const compositeKeys = useMemo(() => {
    if (!activeEntityGroup) return ["all"];
    return generateUniqueCompositeKeys(
      activeEntityGroup.entities,
      pivotItems,
      categories,
    );
  }, [activeEntityGroup, pivotItems, categories]);

  // Generate columns and column grouping model
  const { columns, columnGroupingModel } = useMemo(() => {
    return generatePivotColumns(pivotItems, compositeKeys);
  }, [pivotItems, compositeKeys]);

  // Generate rows
  const rows = useMemo(() => {
    if (!activeEntityGroup) return [];

    const measurementGetters = createMeasurementGetters(activeEntityGroup);
    return generatePivotRows(
      activeEntityGroup,
      categories,
      pivotItems,
      measurementGetters,
    );
  }, [activeEntityGroup, categories, pivotItems]);

  return (
    <Box
      data-id="pivotTable"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <DataGrid
        apiRef={gridApiRef}
        data-help={HelpItem.MeasurementDataTable}
        rowSpacingType="border"
        autosizeOnMount
        autosizeOptions={{ expand: true, includeHeaders: true }}
        columns={columns}
        rows={rows}
        columnGroupingModel={columnGroupingModel as GridColumnGroup[]}
        density="compact"
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          height: "100%",
          maxHeight: "100%",
          minHeight: 0,
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "bold",
          },
          "& .MuiDataGrid-columnHeader--filledGroup": {
            backgroundColor: theme.palette.action.hover,
          },
        })}
      />
    </Box>
  );
};
