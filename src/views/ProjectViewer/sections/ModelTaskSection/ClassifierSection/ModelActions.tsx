import { useMemo } from "react";

import { useSelector } from "react-redux";

import { Box, CircularProgress } from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  LabelImportant as LabelImportantIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { TooltipTextButton } from "components/inputs";

import { useParameterizedSelector } from "store/hooks";
import {
  selectModelIsTrained,
  selectModelLifecycleStatus,
  selectRunsForActiveModel,
} from "store/classifier/selectors";
import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

import {
  useClassifierStatus,
  ErrorReason,
} from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { selectTotalActiveUnlabeledItems } from "@ProjectViewer/state/reselectors";
import {
  usePredictClassifier,
  useEvaluateClassifier,
} from "@ProjectViewer/hooks";

import { FitClassifierDialog } from "./FitClassifierDialog";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";

import type { ModelLifecycleStatus } from "core/dl/classification/types";

export const ModelActions = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  return (
    <Box
      data-doc="model-actions"
      sx={{ display: "flex", width: "100%", justifyContent: "space-between" }}
    >
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
      <TooltipTextButton
        tooltipText={helperText}
        onClick={handleOpenFitClassifierDialog}
        disabled={!precheck.modelTrainable}
        startIcon={<ScatterPlotIcon />}
        label="Fit"
        sx={{
          font: "var(--mui-font-caption)",
          color: "var(--mui-palette-primary-main)",
        }}
        data-help={HelpItem.FitModelDialog}
      />

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
  // Read the channel gate directly rather than through `error`: that is only
  // the most severe error, so a severity-1 one (e.g. an inference-only model)
  // would hide a channel mismatch and leave Predict enabled.
  const { precheck, activeErrors } = useClassifierStatus();
  const modelIsTrained = useParameterizedSelector(
    selectModelIsTrained,
    modelTarget,
  );
  const totalUnlabeledItems = useSelector(selectTotalActiveUnlabeledItems);
  const predictClassifier = usePredictClassifier();
  const handlePredict = async () => {
    await predictClassifier();
  };

  // Ordered so the tooltip names the reason the button is disabled.
  const helperText = useMemo(() => {
    if (modelStatus === "predicting") return "...Predicting";
    if (modelStatus !== "idle") return "...Pending";
    if (!modelIsTrained) return "No Trained Model";
    if (!precheck.channelsValid)
      return (
        activeErrors.find((e) => e.reason === ErrorReason.ChannelMismatch)
          ?.message ?? "Model input channels do not match the visible channels"
      );
    if (totalUnlabeledItems === 0) return "No unlabeled items to predict";
    return "Predict Model";
  }, [
    modelStatus,
    modelIsTrained,
    precheck.channelsValid,
    activeErrors,
    totalUnlabeledItems,
  ]);

  const predictionDisabled =
    !modelIsTrained ||
    modelStatus !== "idle" ||
    totalUnlabeledItems === 0 ||
    !precheck.channelsValid;

  return (
    <TooltipTextButton
      tooltipText={helperText}
      onClick={handlePredict}
      disabled={predictionDisabled}
      startIcon={
        modelStatus === "predicting" ? (
          <CircularProgress disableShrink />
        ) : (
          <LabelImportantIcon />
        )
      }
      label="Predict"
      sx={{
        font: "var(--mui-font-caption)",
        color: "var(--mui-palette-primary-main)",
      }}
      data-help={HelpItem.PredictModel}
    />
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
      <TooltipTextButton
        tooltipText={helperText}
        onClick={handleEvaluate}
        disabled={activeRuns.length === 0}
        startIcon={<AssessmentIcon />}
        label="Evaluate"
        sx={{
          font: "var(--mui-font-caption)",
          color: "var(--mui-palette-primary-main)",
        }}
        data-help={HelpItem.EvaluateModel}
      />

      <EvaluateClassifierDialog
        openedDialog={evaluateClassifierDialogOpen}
        closeDialog={handleCloseEvaluateClassifierDialog}
      />
    </>
  );
};
