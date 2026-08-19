import { Box, Typography } from "@mui/material";

import { ComputedObjectMeasurementOptions } from "./measurement-selection-options/ComputedObjectMeasurements";
import { IntensityMeasurementOptions } from "./measurement-selection-options/IntensityMeasurementOptions";

import type {
  ImageMeasurementGroup,
  ObjectMeasurementGroup,
} from "@MeasurementViewer/types";

export const MeasurementSelection = ({
  group,
}: {
  group: ObjectMeasurementGroup | ImageMeasurementGroup;
}) => {
  const isObjectGroup = "kind" in group;
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
    </Box>
  );
};
