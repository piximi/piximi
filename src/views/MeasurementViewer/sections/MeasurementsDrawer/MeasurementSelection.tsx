import { useMemo } from "react";

import { Box, Button, Typography } from "@mui/material";

import { useBackend } from "core/backend";

import { useMeasurementTable } from "@MeasurementViewer/contexts/MeasurementTableProvider";

import { ComputedObjectMeasurementOptions } from "./measurement-selection-options/ComputedObjectMeasurements";
import { IntensityMeasurementOptions } from "./measurement-selection-options/IntensityMeasurementOptions";

import type {
  ImageMeasurementGroup,
  ObjectMeasurementGroup,
} from "@MeasurementViewer/types";

/* Entities the backend has no value for in some selected measurement. */
const useUnmeasuredCount = (): number => {
  const { table, columns } = useMeasurementTable();
  return useMemo(() => {
    if (!table || columns.length === 0) return 0;
    let count = 0;
    for (let i = 0; i < table.ids.length; i++) {
      if (columns.some(({ key }) => table.values[key]?.[i] === null)) count++;
    }
    return count;
  }, [table, columns]);
};

export const MeasurementSelection = ({
  group,
}: {
  group: ObjectMeasurementGroup | ImageMeasurementGroup;
}) => {
  const backend = useBackend();
  const unmeasured = useUnmeasuredCount();
  const isObjectGroup = "kind" in group;

  // The job's progress shows in the task toasts; the table follows the
  // backend's announcement once the objects are measured.
  const measure = () => {
    if (!backend.measurements) return;
    backend.measurements
      .compute({
        scope: isObjectGroup
          ? { type: "objects", kindId: group.kind }
          : { type: "images" },
      })
      .catch((error) => console.error("[MeasurementSelection] measure", error));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--mui-palette-divider)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid var(--mui-palette-divider)",
          p: 1,
        }}
      >
        <Typography sx={{ fontSize: "0.825rem", textAlign: "center" }}>
          Select measurements to display for{" "}
          <span style={{ fontWeight: "bold" }}>
            {isObjectGroup ? group.name + " objects" : "images"}
          </span>
        </Typography>
      </Box>
      {isObjectGroup && <ComputedObjectMeasurementOptions group={group} />}
      <IntensityMeasurementOptions group={group} />
      {unmeasured > 0 && backend.measurements && (
        <Box
          data-testid="unmeasured-objects"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 1,
            py: 0.5,
            borderTop: "1px solid var(--mui-palette-divider)",
          }}
        >
          <Typography variant="caption">
            {unmeasured} {isObjectGroup ? "object" : "image"}
            {unmeasured === 1 ? " has" : "s have"} missing measurements
          </Typography>
          <Button size="small" onClick={measure}>
            Measure
          </Button>
        </Box>
      )}
    </Box>
  );
};
