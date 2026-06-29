import { Stack, Typography } from "@mui/material";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

export const ModelInfo = () => {
  const { loadedModel } = useSegmenterStatus();
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
        {`Selected Model:  ${loadedModel ? loadedModel.name : "No Selected Model"}`}
      </Typography>
      <Typography variant="caption" noWrap>
        {`Model Kind:  ${loadedModel?.kind ?? "N/A"}`}
      </Typography>
    </Stack>
  );
};
