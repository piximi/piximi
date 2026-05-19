import React from "react";

import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { TooltipButton } from "components/ui/tooltips/TooltipButton";

import type { ModelLifecycleStatus } from "utils/dl/classification/types";

import type { ErrorReason } from "@ProjectViewer/contexts/ClassifierStatusProvider";

type ModelExecButtonGroupProps = {
  handleFit: () => void;
  handleEvaluate: () => void;
  handlePredict: () => Promise<void>;
  modelStatus: ModelLifecycleStatus | undefined;
  execConfig: {
    fit: { helperText: string; disabled: boolean };
    predict: { helperText: string; disabled: boolean };
    evaluate: { helperText: string; disabled: boolean };
  };
  error?: ErrorReason;
};

export const ModelExecButtonGroup = ({
  handleFit,
  handleEvaluate,
  handlePredict,
  execConfig,
  modelStatus,
}: ModelExecButtonGroupProps) => {
  return (
    <Box width="100%" display="flex" justifyContent={"space-evenly"}>
      {/* Fit Button */}
      <TooltipButton
        tooltipTitle={execConfig.fit.helperText}
        disableRipple
        onClick={handleFit}
        disabled={execConfig.fit.disabled}
      >
        <ScatterPlotIcon />
      </TooltipButton>
      {/* Predict Button */}
      <TooltipButton
        disableRipple
        tooltipTitle={execConfig.predict.helperText}
        onClick={handlePredict}
        disabled={execConfig.predict.disabled}
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
        tooltipTitle={execConfig.evaluate.helperText}
        disableRipple
        onClick={handleEvaluate}
        disabled={execConfig.evaluate.disabled}
      >
        <AssessmentIcon />
      </TooltipButton>
    </Box>
  );
};

/*

*/
