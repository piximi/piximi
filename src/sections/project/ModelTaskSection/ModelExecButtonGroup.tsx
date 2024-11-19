import React from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { TooltipButton } from "components/tooltips/TooltipButton/TooltipButton";
import { ModelStatus } from "utils/models/enums";

export const ModelExecButtonGroup = ({
  handlePredict,
  handleEvaluate,
  handleFit,
  modelStatus,
  modelTrainable,
  helperText,
}: {
  handlePredict: () => void;
  handleEvaluate: () => void;
  handleFit: () => void;
  modelStatus: ModelStatus;
  modelTrainable: boolean;
  helperText: string;
}) => {
  return (
    <Box width="100%" display="flex" justifyContent={"space-evenly"}>
      <TooltipButton
        tooltipTitle={modelTrainable ? "Fit Model" : "Model is inference only"}
        disableRipple
        onClick={handleFit}
        disabled={!modelTrainable}
      >
        <ScatterPlotIcon />
      </TooltipButton>

      <TooltipButton
        disableRipple
        tooltipTitle={
          modelStatus === ModelStatus.Predicting
            ? "...predicting"
            : modelStatus !== ModelStatus.Trained
            ? helperText
            : "Predict Model"
        }
        onClick={handlePredict}
        disabled={modelStatus !== ModelStatus.Trained}
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
        tooltipTitle={
          !modelTrainable
            ? "Can't evaluate non-trainable models"
            : modelStatus !== ModelStatus.Trained &&
              modelStatus !== ModelStatus.Evaluating
            ? helperText
            : "Evaluate Model"
        }
        disableRipple
        onClick={handleEvaluate}
        disabled={modelStatus !== ModelStatus.Trained || !modelTrainable}
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
