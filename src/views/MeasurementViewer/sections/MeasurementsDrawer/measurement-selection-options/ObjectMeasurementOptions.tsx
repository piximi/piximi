import { Box, Divider } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { ComputedObjectMeasurementOptions } from "./ComputedObjectMeasurements";

import type { ObjectMeasurementGroup } from "@MeasurementViewer/types";

export const ObjectMeasurementOptions = ({
  group,
}: {
  group: ObjectMeasurementGroup;
}) => {
  return (
    <Box
      sx={{
        mx: 1,
      }}
    >
      <Divider data-help={HelpItem.MeasurementsTree} title="Measurements" />
      <ComputedObjectMeasurementOptions group={group} />
    </Box>
  );
};
