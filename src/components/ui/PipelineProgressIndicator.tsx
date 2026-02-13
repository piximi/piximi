import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

import {
  useIsPipelineProcessing,
  usePipelineProgress,
} from "contexts/DataPipelineProvider";

/**
 * Shows a progress bar when the data pipeline is actively processing.
 * Place this in the app layout — it auto-hides when idle.
 */
export const PipelineProgressIndicator: React.FC = () => {
  const isProcessing = useIsPipelineProcessing();
  const progress = usePipelineProgress();

  if (!isProcessing) return null;

  const stageLabels: Record<string, string> = {
    loading: "Loading files",
    analyzing: "Analyzing files",
    preparing: "Preparing images",
    storing: "Saving to storage",
  };

  const label = stageLabels[progress.stage] ?? progress.stage;

  return (
    <Box
      sx={(theme) => ({
        position: "absolute",
        bgcolor: theme.palette.primary.main,
        bottom: 8,
        width: "50%",
        left: "50%",
        transform: "translate(-50%,0)",
        px: 2,
        py: 1,
        zIndex: 9999,
        mx: "auto",
        borderRadius: theme.shape.borderRadius,
        color: theme.palette.getContrastText(theme.palette.primary.main),
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2">
          {label}
          {progress.currentFile ? ` — ${progress.currentFile}` : ""}
        </Typography>
        <Typography variant="body2">
          {progress.processedCount}/{progress.totalCount}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress.overallProgress}
        color="inherit"
      />
    </Box>
  );
};
