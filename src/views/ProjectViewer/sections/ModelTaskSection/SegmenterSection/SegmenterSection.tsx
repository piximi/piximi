import { Box, Divider } from "@mui/material";

import { ModelActions } from "./ModelActions";
import { ModelInfo } from "./ModelInfo";

export const SegmenterSection = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      width="100%"
      px={1}
    >
      <ModelInfo />
      <Divider flexItem />
      <ModelActions />
    </Box>
  );
};
