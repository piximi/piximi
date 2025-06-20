import React from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { TooltipButton } from "components/ui/tooltips/TooltipButton";

import { ModelStatus } from "utils/models/enums";
import { ClassifierErrorReason } from "views/ProjectViewer/contexts/types";

export const ModelExecButtonGroup = ({
  handleFit,
  handleEvaluate,
  handlePredict,
  execConfig,
  modelStatus,
}: {
  handleFit: () => void;
  handleEvaluate: () => void;
  handlePredict: () => Promise<void>;
  modelStatus: ModelStatus;
  execConfig: {
    fit: { helperText: string; disabled: boolean };
    predict: { helperText: string; disabled: boolean };
    evaluate: { helperText: string; disabled: boolean };
  };
  error?: ClassifierErrorReason;
}) => {
  return (
    <Box width="100%" display="flex" justifyContent={"space-evenly"}>
      <TooltipButton
        tooltipTitle={execConfig.fit.helperText}
        disableRipple
        onClick={handleFit}
        disabled={execConfig.fit.disabled}
      >
        <ScatterPlotIcon />
      </TooltipButton>

      <TooltipButton
        disableRipple
        tooltipTitle={execConfig.predict.helperText}
        onClick={handlePredict}
        disabled={execConfig.predict.disabled}
      >
        {modelStatus === ModelStatus.Predicting ? (
          <CircularProgress
            disableShrink
            size={24}
            sx={{ alignSelf: "center" }}
          />
        ) : (
          <LabelImportantIcon />
        )}
      </TooltipButton>

      <TooltipButton
        tooltipTitle={execConfig.evaluate.helperText}
        disableRipple
        onClick={handleEvaluate}
        disabled={execConfig.evaluate.disabled}
      >
        {modelStatus === ModelStatus.Evaluating ? (
          <CircularProgress
            disableShrink
            size={24}
            sx={{ alignSelf: "center" }}
          />
        ) : (
          <AssessmentIcon />
        )}
      </TooltipButton>
    </Box>
  );
};

/*

*/
