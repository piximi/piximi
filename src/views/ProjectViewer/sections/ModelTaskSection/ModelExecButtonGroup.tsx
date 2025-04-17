import React, { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { TooltipButton } from "components/ui/tooltips/TooltipButton/TooltipButton";

import { ModelStatus } from "utils/models/enums";
import { usePredictClassifier } from "views/ProjectViewer/hooks/usePredictClassifier";
import { useSelector } from "react-redux";
import { selectClassifierModel } from "store/classifier/reselectors";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { selectActiveUnlabeledThingsIds } from "store/project/reselectors";

export const ModelExecButtonGroup = ({
  handleFit,
  handleEvaluate,
  modelTrainable,
  helperText,
}: {
  handleFit: () => void;
  handleEvaluate: () => void;
  modelStatus: ModelStatus;
  modelTrainable: boolean;
  helperText: string;
}) => {
  const predictClassifier = usePredictClassifier();
  const selectedModel = useSelector(selectClassifierModel);
  const unlabeledThings = useSelector(selectActiveUnlabeledThingsIds);
  const { modelStatus } = useClassifierStatus();

  useEffect(() => {
    console.log(unlabeledThings);
  }, [unlabeledThings]);
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
            : modelStatus === ModelStatus.Idle
              ? helperText
              : "Predict Model"
        }
        onClick={predictClassifier}
        disabled={
          !selectedModel ||
          modelStatus !== ModelStatus.Idle ||
          unlabeledThings.length === 0
        }
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
