import { Box } from "@mui/material";

import { useSegmenter } from "@ProjectViewer/hooks";

import { SegmenterOptionsPanel, ChannelMapping } from "./settings";
import { SectionHeader } from "./SectionHeader";
import { ModelOutput } from "./settings/ModelOutput";

export const SegmenterOptions = () => {
  const { loadedModel } = useSegmenter();

  return !loadedModel ? null : (
    <Box sx={{ width: "100%" }}>
      <SectionHeader title="Model Settings" />

      <Box
        sx={{ display: "flex", flexDirection: "column", width: "100%", px: 1 }}
      >
        <ModelOutput />
        <ChannelMapping />
        <SegmenterOptionsPanel />
      </Box>
    </Box>
  );
};
