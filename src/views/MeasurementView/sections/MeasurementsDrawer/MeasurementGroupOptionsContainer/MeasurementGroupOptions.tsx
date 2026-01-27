import { Box } from "@mui/material";

import { ImageMeasurementOptions } from "./ImageMeasurementOptions";
import { ObjectMeasurementOptions } from "./ObjectMeasurementOptions";
import { ImageMeasurementGroup, ObjectMeasurementGroup } from "../../../types";

export const MeasurementGroupOptions = ({
  table,
}: {
  table: ObjectMeasurementGroup | ImageMeasurementGroup;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!("kind" in table) ? (
        <ImageMeasurementOptions group={table} />
      ) : (
        <ObjectMeasurementOptions group={table} />
      )}
    </Box>
  );
};
