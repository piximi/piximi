import React, { useMemo } from "react";

import { Box } from "@mui/material";

import { TooltipButton } from "components/ui/tooltips/TooltipButton";

import { usePredictSegmenter } from "@ProjectViewer/hooks/usePredictSegmenter";
import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

export const ModelActions = () => {
  const predictSegmenter = usePredictSegmenter();
  const { modelStatus, error, selectedModel } = useSegmenterStatus();
  const predictInfo = useMemo(() => {
    let predictText: string;

    switch (modelStatus) {
      case "idle":
        predictText = error
          ? error.message
          : selectedModel
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
      disabled: !selectedModel || !!error || modelStatus === "predicting",
    };
  }, [modelStatus, selectedModel, error]);
  return (
    <Box width="100%" display="flex" justifyContent={"center"}>
      {/* Predict Button */}
      <TooltipButton
        disableRipple
        tooltipTitle={predictInfo.helperText}
        onClick={predictSegmenter}
        disabled={predictInfo.disabled}
        variant="text"
        size="small"
      >
        Segment
      </TooltipButton>
    </Box>
  );
};
