import React, { useMemo } from "react";

import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

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
    return { helperText: predictText, disabled: !selectedModel || !!error };
  }, [modelStatus, selectedModel, error]);
  return (
    <Box width="100%" display="flex" justifyContent={"space-evenly"}>
      {/* Fit Button */}
      <TooltipButton
        tooltipTitle={"Model is inference only"}
        disableRipple
        onClick={() => {}}
        disabled={true}
      >
        <ScatterPlotIcon />
      </TooltipButton>
      {/* Predict Button */}
      <TooltipButton
        disableRipple
        tooltipTitle={predictInfo.helperText}
        onClick={predictSegmenter}
        disabled={predictInfo.disabled}
      >
        {modelStatus === "predicting" ? (
          <CircularProgress
            disableShrink
            size={24}
            sx={{ alignSelf: "center" }}
          />
        ) : (
          <LabelImportantIcon />
        )}
      </TooltipButton>
      {/* Eval Button */}
      <TooltipButton
        tooltipTitle={"Model is inference only"}
        disableRipple
        onClick={() => {}}
        disabled={true}
      >
        <AssessmentIcon />
      </TooltipButton>
    </Box>
  );
};
