import { Box, Divider } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { IntensityMeasurementOptions } from "./IntensityMeasurementOptions";

import type { ImageMeasurementGroup } from "@MeasurementViewer/types";

export const ImageMeasurementOptions = ({
  group,
}: {
  group: ImageMeasurementGroup;
}) => {
  return (
    <Box
      sx={{
        mx: 1,
      }}
    >
      <Divider data-help={HelpItem.MeasurementsTree} title="Measurements" />

      <IntensityMeasurementOptions group={group} />
    </Box>
  );
};
