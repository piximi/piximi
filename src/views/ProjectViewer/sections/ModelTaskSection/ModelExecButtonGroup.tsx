import React, { useMemo } from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { TooltipButton } from "components/ui/tooltips/TooltipButton/TooltipButton";

import { ModelStatus } from "utils/models/enums";
import { useSelector } from "react-redux";
import { selectClassifierModel } from "store/classifier/reselectors";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { selectActiveUnlabeledThingsIds } from "store/project/reselectors";

export const ModelExecButtonGroup = ({
  handleFit,
  handleEvaluate,
  handlePredict,
  modelTrainable,
}: {
  handleFit: () => void;
  handleEvaluate: () => void;
  handlePredict: () => Promise<void>;
  modelStatus: ModelStatus;
  modelTrainable: boolean;
}) => {
  const selectedModel = useSelector(selectClassifierModel);
  const unlabeledThings = useSelector(selectActiveUnlabeledThingsIds);
  const { modelStatus } = useClassifierStatus();

  const predictHelperText = useMemo(() => {
    switch (modelStatus) {
      case ModelStatus.Idle:
        return selectedModel ? "Predict Model" : "No Trained Model";
      case ModelStatus.Predicting:
        return "...Predicting";
      default:
        return "...Pending";
    }
  }, [selectedModel, modelStatus]);

  const fitHelperText = useMemo(() => {
    switch (modelStatus) {
      case ModelStatus.Idle:
      case ModelStatus.Pending:
        return modelTrainable ? "Fit Model" : "Model is inference only";
      default:
        return "...busy";
    }
  }, [modelStatus, modelTrainable]);

  const evaluateHelperText = useMemo(() => {
    if (selectedModel) {
      return modelTrainable
        ? modelStatus === ModelStatus.Idle ||
          modelStatus === ModelStatus.Pending
          ? "Evaluate Model"
          : "...Pending"
        : "Cannot evaluate non-trainable models";
    } else {
      return "No Trained Model";
    }
  }, [modelStatus, modelTrainable, selectedModel]);

  const predictionDisabled = useMemo(() => {
    return (
      !selectedModel ||
      !selectedModel.pretrained ||
      modelStatus !== ModelStatus.Idle ||
      unlabeledThings.length === 0
    );
  }, [selectedModel, modelStatus, unlabeledThings]);

  return (
    <Box width="100%" display="flex" justifyContent={"space-evenly"}>
      <TooltipButton
        tooltipTitle={fitHelperText}
        disableRipple
        onClick={handleFit}
        disabled={!modelTrainable}
      >
        <ScatterPlotIcon />
      </TooltipButton>

      <TooltipButton
        disableRipple
        tooltipTitle={predictHelperText}
        onClick={handlePredict}
        disabled={predictionDisabled}
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
        tooltipTitle={evaluateHelperText}
        disableRipple
        onClick={handleEvaluate}
        disabled={!selectedModel || !selectedModel.pretrained}
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
