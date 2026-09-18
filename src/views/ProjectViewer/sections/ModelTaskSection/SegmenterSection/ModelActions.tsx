import { useMemo } from "react";

import { Box } from "@mui/material";

import { TooltipTextButton } from "@ProjectViewer/components";
import { usePredictSegmenter } from "@ProjectViewer/hooks";
import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

export const ModelActions = () => {
  const predictSegmenter = usePredictSegmenter();
  const { modelStatus, error, loadedModel } = useSegmenterStatus();
  const predictInfo = useMemo(() => {
    let predictText: string;

    switch (modelStatus) {
      case "idle":
        predictText = error
          ? error.message
          : loadedModel
            ? "Predict Model"
            : "No Trained Model";
        break;
      case "predicting":
        predictText = "...Predicting";
        break;
      default:
        predictText = "...Pending";
    }
    return {
      helperText: predictText,
      disabled: !loadedModel || !!error || modelStatus === "predicting",
    };
  }, [modelStatus, loadedModel, error]);
  return (
    <Box width="100%" display="flex" justifyContent="center">
      {/* Predict Button */}
      <TooltipTextButton
        tooltipText={predictInfo.helperText}
        onClick={predictSegmenter}
        disabled={predictInfo.disabled}
        label="Segment"
        sx={{
          font: "var(--mui-font-caption)",
          color: "var(--mui-palette-primary-main)",
        }}
      />
    </Box>
  );
};
