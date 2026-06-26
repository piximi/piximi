import { Stack, Typography } from "@mui/material";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

export const ModelInfo = () => {
  const { selectedModel } = useSegmenterStatus();
  return (
    <Stack
      sx={(theme) => ({
        width: "100%",
        py: 0.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Typography variant="caption" noWrap>
        {`Selected Model:  ${selectedModel ? selectedModel.name : "No Selected Model"}`}
      </Typography>
      <Typography variant="caption" noWrap>
        {`Model Kind:  ${selectedModel?.kind ?? "N/A"}`}
      </Typography>
    </Stack>
  );
};
