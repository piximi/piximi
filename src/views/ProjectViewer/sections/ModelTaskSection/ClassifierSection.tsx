import { useMemo } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, IconButton, MenuItem, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { useDialog, useDialogHotkey } from "hooks";

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
  selectActiveModel,
  selectKindClassifier,
  selectModelLifecycleStatus,
} from "store/classifier/selectors";
import { ModelArch } from "store/classifier/types";

import { HotkeyContext } from "utils/enums";
import type { SequentialClassifier } from "utils/dl/classification";
import classifierHandler from "utils/dl/classification/classifierHandler";

import { PredictionListItems } from "./PredictionListItems";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";
import { FitClassifierDialog } from "./FitClassifierDialog";
import { ImportTensorflowClassificationModelDialog } from "./ImportTensorflowModelDialog";
import { ModelIOButtonGroup } from "./ModelIOButtonGroup";
import { ModelExecButtonGroup } from "./ModelExecButtonGroup";

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
  const model = useParameterizedSelector(selectActiveModel, modelTarget);
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
    if (!model || !kindClassifier) return;
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
          return !model || model.trainable
            ? "Fit Model"
            : "Model is inference only";
        default:
          return "...busy";
      }
    })();
    const predictText = (() => {
      switch (modelStatus) {
        case "idle":
          return model ? "Predict Model" : "No Trained Model";
        case "predicting":
          return "...Predicting";
        default:
          return "...Pending";
      }
    })();
    const predictionDisabled =
      !model ||
      !model.pretrained ||
      modelStatus !== "idle" ||
      totalUnlabeledItems === 0 ||
      error?.reason === ErrorReason.ChannelMismatch;

    const evaluateText = (() => {
      if (model) {
        return model.trainable
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
        disabled: !(!model || model.trainable),
      },
      predict: { helperText: predictText, disabled: predictionDisabled },
      evaluate: {
        helperText: evaluateText,
        disabled: !model || !model.pretrained,
      },
    };
  }, [modelStatus, model, error]);

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
          hasTrainedModel={!!model}
          handleImportModel={handleOpenImportClassifierDialog}
          handleSaveModel={handleOpenSaveClassifierDialog}
        />
        <ModelSelection selectedModel={model} />
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
      {model && (
        <SaveFittedModelDialog
          model={model}
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
  selectedModel,
}: {
  selectedModel: SequentialClassifier | undefined;
}) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const selectedModelName = selectedModel?.name ?? "new";
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
    if (!selectedModel) return;
    classifierHandler.removeModel(selectedModel.name);
    dispatch(
      classifierSlice.actions.setActiveModel({
        targetId: modelTarget,
        modelName: undefined,
      }),
    );
    dispatch(
      classifierSlice.actions.removeModelInfo({
        modelName: selectedModel.name,
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
          disabled={!selectedModel}
        >
          <DeleteIcon sx={{ fontSize: "1.15rem" }} />
        </IconButton>
      </TooltipWithDisable>
    </Stack>
  );
};
