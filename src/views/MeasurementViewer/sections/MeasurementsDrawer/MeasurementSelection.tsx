import { Box } from "@mui/material";

import { ImageMeasurementOptions } from "./measurement-selection-options/ImageMeasurementOptions";
import { ObjectMeasurementOptions } from "./measurement-selection-options/ObjectMeasurementOptions";

import type {
  ImageMeasurementGroup,
  ObjectMeasurementGroup,
} from "@MeasurementViewer/types";

export const MeasurementSelection = ({
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
