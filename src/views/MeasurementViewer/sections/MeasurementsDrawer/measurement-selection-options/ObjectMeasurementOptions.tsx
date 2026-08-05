import { useDispatch } from "react-redux";

import { Box, Divider } from "@mui/material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { measurementsSlice } from "@MeasurementViewer/state";
import { ComputedObjectMeasurementOptions } from "./ComputedObjectMeasurements";

import type { ObjectMeasurementGroup } from "@MeasurementViewer/types";
import { FeatureKey } from "store/dataV2/types";

export const ObjectMeasurementOptions = ({
  group,
}: {
  group: ObjectMeasurementGroup;
}) => {
  const dispatch = useDispatch();

  const dispatchComputedMeasurementWorker = (itemIds: string[]) => {
    dispatch(
      measurementsSlice.actions.addObjectComputedMeasurements({
        groupId: group.id,
        measurements: itemIds as FeatureKey[],
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
      <ComputedObjectMeasurementOptions
        group={group}
        onSelect={dispatchComputedMeasurementWorker}
      />
    </Box>
  );
};
