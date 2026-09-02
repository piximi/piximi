import { useMemo } from "react";

import { Box } from "@mui/material";

import { TooltipButton } from "@ProjectViewer/components";
import { usePredictSegmenter } from "@ProjectViewer/hooks/usePredictSegmenter";
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
