import React, { useMemo } from "react";

import { useSelector } from "react-redux";

import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { TooltipButton } from "components/ui/tooltips/TooltipButton";

import {
  useClassifierStatus,
  ErrorReason,
} from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { useParameterizedSelector } from "store/hooks";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import {
  selectModelIsTrained,
  selectModelLifecycleStatus,
  selectRunsForActiveModel,
} from "store/classifier/selectors";
import { selectTotalActiveUnlabeledItems } from "@ProjectViewer/state/reselectors";
import { usePredictClassifier } from "@ProjectViewer/hooks/usePredictClassifier";
import { useEvaluateClassifier } from "@ProjectViewer/hooks/useEvaluateClassifier";

import type { ModelLifecycleStatus } from "utils/dl/classification/types";
import { HotkeyContext } from "utils/enums";

import { FitClassifierDialog } from "./FitClassifierDialog";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";

export const ModelActions = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  return (
    <Box width="100%" display="flex" justifyContent={"space-evenly"}>
      <FitClassifierButton modelStatus={modelStatus} />
      <PredictClassifierButton modelStatus={modelStatus} />
      <EvaluateClassifierButton modelStatus={modelStatus} />
    </Box>
  );
};

const FitClassifierButton = ({
  modelStatus,
}: {
  modelStatus: ModelLifecycleStatus;
}) => {
  const {
    onClose: handleCloseFitClassifierDialog,
    onOpen: handleOpenFitClassifierDialog,
    open: fitClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ClassifierDialog, false);
  const { precheck } = useClassifierStatus();
  const helperText = useMemo(() => {
    switch (modelStatus) {
      case "idle":
      case "waiting":
        return precheck.modelTrainable
          ? "Fit Model"
          : "Model is inference only";
      default:
        return "...busy";
    }
  }, [modelStatus, precheck.modelTrainable]);

  return (
    <>
      <TooltipButton
        tooltipTitle={helperText}
        disableRipple
        onClick={handleOpenFitClassifierDialog}
        disabled={!precheck.modelTrainable}
      >
        <ScatterPlotIcon />
      </TooltipButton>
      <FitClassifierDialog
        openedDialog={fitClassifierDialogOpen}
        closeDialog={handleCloseFitClassifierDialog}
      />
    </>
  );
};

const PredictClassifierButton = ({
  modelStatus,
}: {
  modelStatus: ModelLifecycleStatus;
}) => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const { error } = useClassifierStatus();
  const activeRuns = useParameterizedSelector(
    selectRunsForActiveModel,
    modelTarget,
  );
  const modelIsTrained = useParameterizedSelector(
    selectModelIsTrained,
    modelTarget,
  );
  const totalUnlabeledItems = useSelector(selectTotalActiveUnlabeledItems);
  const predictClassifier = usePredictClassifier();
  const handlePredict = async () => {
    await predictClassifier();
  };
  const helperText = useMemo(() => {
    switch (modelStatus) {
      case "idle":
        return activeRuns.length > 0 ? "Predict Model" : "No Trained Model";
      case "predicting":
        return "...Predicting";
      default:
        return "...Pending";
    }
  }, [modelStatus, activeRuns]);

  const predictionDisabled = useMemo(
    () =>
      !modelIsTrained ||
      modelStatus !== "idle" ||
      totalUnlabeledItems === 0 ||
      error?.reason === ErrorReason.ChannelMismatch,
    [modelIsTrained, modelStatus, totalUnlabeledItems, error],
  );

  return (
    <>
      <TooltipButton
        tooltipTitle={helperText}
        disableRipple
        onClick={handlePredict}
        disabled={predictionDisabled}
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
    </>
  );
};

const EvaluateClassifierButton = ({
  modelStatus,
}: {
  modelStatus: ModelLifecycleStatus;
}) => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const activeRuns = useParameterizedSelector(
    selectRunsForActiveModel,
    modelTarget,
  );
  const evaluateClassifier = useEvaluateClassifier();

  const {
    onClose: handleCloseEvaluateClassifierDialog,
    onOpen: handleOpenEvaluateClassifierDialog,
    open: evaluateClassifierDialogOpen,
  } = useDialog();
  const { precheck } = useClassifierStatus();
  const helperText = useMemo(() => {
    if (!precheck.modelTrainable) return "Cannot evaluate non-trainable models";
    if (activeRuns.length > 0) {
      if (modelStatus === "idle" || modelStatus === "waiting")
        return "Evaluate Model";
      else return "...Pending";
    } else return "No Trained Model";
  }, [modelStatus, precheck.modelTrainable, activeRuns]);

  const handleEvaluate = async () => {
    const currentRun = activeRuns.at(-1);
    if (!currentRun) return;

    // * Should always be false since evaluation is done automatically after each run
    // * After proper snapshotting eval will be done manually on specific runs
    if (!currentRun.evalResults) await evaluateClassifier();

    handleOpenEvaluateClassifierDialog();
  };

  return (
    <>
      <TooltipButton
        tooltipTitle={helperText}
        disableRipple
        onClick={handleEvaluate}
        disabled={activeRuns.length === 0}
      >
        <AssessmentIcon />
      </TooltipButton>
      <EvaluateClassifierDialog
        openedDialog={evaluateClassifierDialogOpen}
        closeDialog={handleCloseEvaluateClassifierDialog}
      />
    </>
  );
};
