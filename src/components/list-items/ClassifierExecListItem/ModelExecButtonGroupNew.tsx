import React from "react";
import { ScatterPlot as ScatterPlotIcon } from "@mui/icons-material";
import { LabelImportant as LabelImportantIcon } from "@mui/icons-material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { Box, CircularProgress } from "@mui/material";

import { ModelStatus } from "types/ModelType";
import { TooltipButton } from "components/styled-components/TooltipButton/TooltipButton";

export const ModelExecButtonGroupNew = ({
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
          modelStatus === ModelStatus.Evaluating
            ? "...evaluating"
            : modelStatus !== ModelStatus.Trained
            ? helperText
            : "Evaluate Model"
        }
        disableRipple
        onClick={handleEvaluate}
        disabled={modelStatus !== ModelStatus.Trained}
      >
        <AssessmentIcon />
      </TooltipButton>
    </Box>
  );
};

/*

*/
