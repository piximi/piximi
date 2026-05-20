import { useMemo } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, IconButton, MenuItem, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { useClassificationModel, useDialog, useDialogHotkey } from "hooks";

import { SaveFittedModelDialog } from "components/dialogs";
import { WithLabel, StyledSelect } from "components/inputs";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

import { classifierSlice } from "store/classifier";
import {
  ErrorReason,
  useClassifierStatus,
} from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { usePredictClassifier } from "@ProjectViewer/hooks/usePredictClassifier";
import { useEvaluateClassifier } from "@ProjectViewer/hooks/useEvaluateClassifier";
import { selectTotalActiveUnlabeledItems } from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectKindClassifier,
  selectModelLifecycleStatus,
} from "store/classifier/selectors";

import { HotkeyContext } from "utils/enums";
import { ModelArch, type ModelInfoDTO } from "utils/dl/classification/types";

import { PredictionListItems } from "../PredictionListItems";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";
import { FitClassifierDialog } from "./FitClassifierDialog";
import { ImportTensorflowClassificationModelDialog } from "../ImportTensorflowModelDialog";
import { ModelIOButtonGroup } from "../ModelIOButtonGroup";
import { ModelExecButtonGroup } from "../ModelExecButtonGroup";

export const ClassifierSection = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const modelConfig = useClassificationModel();
  const totalUnlabeledItems = useSelector(selectTotalActiveUnlabeledItems);

  const { error } = useClassifierStatus();
  const predictClassifier = usePredictClassifier();
  const evaluateClassifier = useEvaluateClassifier();

  const {
    onClose: handleCloseEvaluateClassifierDialog,
    onOpen: handleOpenEvaluateClassifierDialog,
    open: evaluateClassifierDialogOpen,
  } = useDialog();

  const {
    onClose: handleCloseImportClassifierDialog,
    onOpen: handleOpenImportClassifierDialog,
    open: ImportClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseSaveClassifierDialog,
    onOpen: handleOpenSaveClassifierDialog,
    open: SaveClassifierDialogOpen,
  } = useDialog();
  const {
    onClose: handleCloseFitClassifierDialog,
    onOpen: handleOpenFitClassifierDialog,
    open: fitClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ClassifierDialog, false);

  const handlePredict = async () => {
    await predictClassifier();
  };

  const handleEvaluate = async () => {
    if (!modelConfig || !kindClassifier) return;
    const modelName = kindClassifier.activeModel;
    if (!modelName) return;
    const currentRun = kindClassifier.modelInfoDict[modelName]?.runs.at(-1);
    if (!currentRun) return;

    // * Should always be false since evaluation is done automatically after each run
    // * After proper snapshotting eval will be done manually on specific runs
    if (!currentRun.evalResults) await evaluateClassifier();

    handleOpenEvaluateClassifierDialog();
  };

  const execConfig = useMemo(() => {
    const fitText = (() => {
      switch (modelStatus) {
        case "idle":
        case "waiting":
          return !modelConfig || modelConfig.trainable
            ? "Fit Model"
            : "Model is inference only";
        default:
          return "...busy";
      }
    })();
    const predictText = (() => {
      switch (modelStatus) {
        case "idle":
          return modelConfig ? "Predict Model" : "No Trained Model";
        case "predicting":
          return "...Predicting";
        default:
          return "...Pending";
      }
    })();
    const predictionDisabled =
      !modelConfig ||
      !modelConfig.pretrained ||
      modelStatus !== "idle" ||
      totalUnlabeledItems === 0 ||
      error?.reason === ErrorReason.ChannelMismatch;

    const evaluateText = (() => {
      if (modelConfig) {
        return modelConfig.trainable
          ? modelStatus === "idle" || modelStatus === "waiting"
            ? "Evaluate Model"
            : "...Pending"
          : "Cannot evaluate non-trainable models";
      } else {
        return "No Trained Model";
      }
    })();
    return {
      fit: {
        helperText: fitText,
        disabled: !(!modelConfig || modelConfig.trainable),
      },
      predict: { helperText: predictText, disabled: predictionDisabled },
      evaluate: {
        helperText: evaluateText,
        disabled: !modelConfig || !modelConfig.pretrained,
      },
    };
  }, [modelStatus, modelConfig, error]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        px={1}
        gap={1}
      >
        <ModelIOButtonGroup
          hasTrainedModel={!!modelConfig}
          handleImportModel={handleOpenImportClassifierDialog}
          handleSaveModel={handleOpenSaveClassifierDialog}
        />
        <ModelSelection selectedModelConfig={modelConfig} />
        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleFit={handleOpenFitClassifierDialog}
          handlePredict={handlePredict}
          handleEvaluate={handleEvaluate}
          execConfig={execConfig}
        />
      </Box>
      {modelStatus === "waiting" && <PredictionListItems />}
      <ImportTensorflowClassificationModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
      />
      {modelConfig && (
        <SaveFittedModelDialog
          model={modelConfig}
          onClose={handleCloseSaveClassifierDialog}
          open={SaveClassifierDialogOpen}
        />
      )}
      <FitClassifierDialog
        openedDialog={fitClassifierDialogOpen}
        closeDialog={handleCloseFitClassifierDialog}
      />

      <EvaluateClassifierDialog
        openedDialog={evaluateClassifierDialogOpen}
        closeDialog={handleCloseEvaluateClassifierDialog}
      />
    </>
  );
};

const ModelSelection = ({
  selectedModelConfig,
}: {
  selectedModelConfig: ModelInfoDTO | undefined;
}) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const selectedModelName = selectedModelConfig?.name ?? "new";
  const handleModelChange = (event: SelectChangeEvent<unknown>) => {
    const value: string | ModelArch = event.target.value as string;
    if (value === "new") {
      batch(() => {
        dispatch(
          classifierSlice.actions.setActiveModel({
            targetId: modelTarget,
            modelName: undefined,
          }),
        );
        dispatch(
          classifierSlice.actions.setNewModelArch({
            targetId: modelTarget,
            modelArch: ModelArch.SIMPLE_CNN,
          }),
        );
      });
    } else {
      dispatch(
        classifierSlice.actions.setActiveModel({
          targetId: modelTarget,
          modelName: value,
        }),
      );
    }
  };
  const handleDisposeModel = () => {
    if (!selectedModelConfig) return;
    classifierHandler.removeModel(selectedModelConfig.name);
    dispatch(
      classifierSlice.actions.setActiveModel({
        targetId: modelTarget,
        modelName: undefined,
      }),
    );
    dispatch(
      classifierSlice.actions.removeModelInfo({
        modelName: selectedModelConfig.name,
      }),
    );
  };
  return (
    <Stack
      direction="row"
      width="100%"
      sx={(theme) => ({
        width: "100%",
        justifyContent: "space-between",
        py: 1.5,
        px: 0.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <WithLabel
        label="Model:"
        labelProps={{
          variant: "body2",
          sx: {
            mr: "0.5rem",
            whiteSpace: "nowrap",
          },
        }}
        sx={{ maxWidth: "calc(100% - 23px)" }}
      >
        <StyledSelect
          value={selectedModelName}
          onChange={handleModelChange}
          fullWidth
          variant="standard"
          disabled={classifierHandler.getModelNames().length === 0}
        >
          <MenuItem
            dense
            value="new"
            sx={{
              borderRadius: 0,
              minHeight: "1rem",
            }}
          >
            New Model
          </MenuItem>
          {classifierHandler.getModelNames().map((modelName, idx) => (
            <MenuItem
              key={modelName + idx}
              dense
              value={modelName}
              sx={{
                borderRadius: 0,
                minHeight: "1rem",
              }}
            >
              {modelName}
            </MenuItem>
          ))}
        </StyledSelect>
      </WithLabel>
      <TooltipWithDisable title={"Delete the current model"} placement="bottom">
        <IconButton
          size="small"
          sx={{ pr: 0 }}
          onClick={handleDisposeModel}
          disabled={!selectedModelConfig}
        >
          <DeleteIcon sx={{ fontSize: "1.15rem" }} />
        </IconButton>
      </TooltipWithDisable>
    </Stack>
  );
};
