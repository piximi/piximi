import { Box } from "@mui/material";

import { ModelActions } from "./ModelActions";
import { ModelIO } from "./ModelIO";
import { ModelInfo } from "./ModelInfo";

export const SegmenterSection = () => {
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        width="100%"
        px={1}
      >
        <ModelIO />

        <ModelInfo />

        <ModelActions />
      </Box>
    </>
  );
};
