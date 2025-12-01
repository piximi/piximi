import { Stack } from "@mui/material";

import { ManualTrackCreation } from "./ManualTrackCreation";
import { AutoTrackCreation } from "./AutoTrackCreation";

export const TrackCreationControls = () => {
  return (
    <Stack alignItems="flex-start">
      <ManualTrackCreation />

      <AutoTrackCreation />
    </Stack>
  );
};
