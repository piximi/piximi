import { useMemo } from "react";

import { useSelector } from "react-redux";

import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { INTENSITY_MEASUREMENTS } from "core/entities";

import {
  selectCategoryEntities,
  selectExtendedImageEntities,
} from "store/data/selectors";

import { HelpItem } from "data/help/HelpContent";

import { selectActivePivotItems } from "@MeasurementViewer/state/selectors";
import { selectActiveMeasuredEntitiesGroup } from "@MeasurementViewer/state/reselectors";
import { parseChannelMeasurementLabel } from "@MeasurementViewer/utils";

import {
  generatePivotColumns,
  generatePivotRows,
  generateUniqueCompositeKeys,
} from "./pivotUtils";

import type { GridColumnGroup } from "@mui/x-data-grid";
import type { GridApiCommunity } from "@mui/x-data-grid/internals";

import type { ObjectFeature } from "core/entities";

import type {
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
} from "@MeasurementViewer/types";

import type { EntityWithMeasurements, MeasurementGetter } from "./pivotUtils";

/**
 * Creates measurement getter functions for all feature and intensity measurements.
 */
const createMeasurementGetters = (
  activeEntityGroup: ImageEntityMeasurementGroup | ObjectEntityMeasurementGroup,
): MeasurementGetter[] => {
  const getters: MeasurementGetter[] = [];

  // Computed measurements
  activeEntityGroup.featureMeasurements.forEach((measurement) => {
    getters.push({
      key: measurement,
      label: measurement,
      getValue: (entity: EntityWithMeasurements) => {
        if (!("kindId" in entity)) return undefined;
        const value = entity.features?.[measurement as ObjectFeature];
        return typeof value === "number" ? value : undefined;
      },
    });
  });

  // Intensity measurements (excluding base keys)
  const intensityMeasurements = activeEntityGroup.intensityMeasurements.filter(
    (msrmnt) =>
      ![
        "intensity",
        ...(INTENSITY_MEASUREMENTS as unknown as string[]),
      ].includes(msrmnt),
  );

  intensityMeasurements.forEach((measurementLabel) => {
    const { channelId, measurement } =
      parseChannelMeasurementLabel(measurementLabel);

    getters.push({
      key: measurementLabel,
      label: measurementLabel,
      getValue: (entity: EntityWithMeasurements) => {
        const channelData = entity.channelsRef.find(
          (c) => c.name === channelId,
        );
        if (!channelData) return;

        if ("kindId" in entity) {
          const value =
            entity.intensityMeasurements?.[channelData!.id]?.[measurement];
          if (isNaN(value!)) {
            console.warn(
              `annotation ${entity.id} has an invalid value for ${measurement}`,
            );
            return 0;
          }
          return entity.intensityMeasurements?.[channelData!.id]?.[measurement];
        }
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
  const images = useSelector(selectExtendedImageEntities);

  // Generate composite keys based on pivot configuration
  const compositeKeys = useMemo(() => {
    if (!activeEntityGroup) return ["all"];
    return generateUniqueCompositeKeys(
      activeEntityGroup.entities,
      pivotItems,
      categories,
      images,
    );
  }, [activeEntityGroup, pivotItems, categories, images]);

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
      images,
      pivotItems,
      measurementGetters,
    );
  }, [activeEntityGroup, categories, images, pivotItems]);

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
