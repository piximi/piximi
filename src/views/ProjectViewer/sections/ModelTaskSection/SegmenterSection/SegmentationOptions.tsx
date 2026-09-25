import { useState } from "react";

import { Box, Button, Typography } from "@mui/material";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { SegmenterOptionsPanel, ChannelMapping } from "./settings";

export const SegmenterOptions = () => {
  const { loadedModel, schema } = useSegmenterStatus();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvanced = schema?.groups.some(
    (group) =>
      !group.describesChannels && group.fields.some((field) => field.advanced),
  );

  return !loadedModel ? null : (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.6 }}
        >
          Model Settings
        </Typography>
        {hasAdvanced && (
          <Button
            size="small"
            onClick={() => setShowAdvanced((shown) => !shown)}
            sx={{
              font: "var(--mui-font-caption)",
              textTransform: "none",
            }}
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </Button>
        )}
      </Box>
      <Box
        sx={{ display: "flex", flexDirection: "column", width: "100%", px: 1 }}
      >
        <ChannelMapping />
        <SegmenterOptionsPanel showAdvanced={showAdvanced} />
      </Box>
    </Box>
  );
};
