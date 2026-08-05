import { useDispatch } from "react-redux";

import { Box, Divider } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { measurementsSlice } from "@MeasurementViewer/state";
import { IntensityMeasurementOptions } from "./IntensityMeasurementOptions";

import type { ImageMeasurementGroup } from "@MeasurementViewer/types";

export const ImageMeasurementOptions = ({
  group,
}: {
  group: ImageMeasurementGroup;
}) => {
  const dispatch = useDispatch();

  const dispatchIntensityMeasurementWorker = (itemIds: string[]) => {
    dispatch(
      measurementsSlice.actions.addIntensityMeasurements({
        groupId: group.id,
        measurements: itemIds,
      }),
    );
  };

  return (
    <Box
      sx={{
        mx: 1,
      }}
    >
      <Divider data-help={HelpItem.MeasurementsTree} title="Measurements" />

      <IntensityMeasurementOptions
        group={group}
        onSelect={dispatchIntensityMeasurementWorker}
      />
    </Box>
  );
};
