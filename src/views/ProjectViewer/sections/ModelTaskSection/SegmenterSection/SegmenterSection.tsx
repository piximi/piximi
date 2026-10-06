import { Stack } from "@mui/material";

import { ModelActions } from "./ModelActions";
import { SegmenterOptions } from "./SegmenterOptions";

export const SegmenterSection = () => {
  return (
    <Stack
      data-doc="segmenter-section"
      sx={{
        width: "100%",
        gap: 0.5,
        px: 1,
      }}
    >
      <ModelActions />
      <SegmenterOptions />
    </Stack>
  );
};
