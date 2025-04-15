import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Stack, Typography } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import { SaveFittedModelDialog } from "components/dialogs";
import { ModelExecButtonGroup } from "./ModelExecButtonGroup";
import { ModelIOButtonGroup } from "./ModelIOButtonGroup";
import { ImportTensorflowClassificationModelDialog } from "./ImportTensorflowModelDialog";
import { FitClassifierDialog } from "./FitClassifierDialog";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";

import { HotkeyContext } from "utils/common/enums";
import { ModelStatus, ModelTask } from "utils/models/enums";
import {
  selectClassifierEvaluationResult,
  selectClassifierModel,
  selectClassifierStatus,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { Model } from "utils/models/Model";
import { Shape } from "store/data/types";
import { SequentialClassifier } from "utils/models/classification";
import { classifierSlice } from "store/classifier";

export const ClassifierSection = () => {
  const dispatch = useDispatch();
  const evaluationResults = useSelector(selectClassifierEvaluationResult);
  const modelStatus = useSelector(selectClassifierStatus);
  const selectedModel = useSelector(selectClassifierModel);
  const activeKindId = useSelector(selectActiveKindId);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const [helperText, setHelperText] = useState<string>("No trained model");

  const handleImportModel = async (model: Model, inputShape: Shape) => {
    if (model instanceof SequentialClassifier) {
      dispatch(
        classifierSlice.actions.loadUserSelectedModel({
          inputShape: inputShape,
          kindId: activeKindId,
          model,
        }),
      );
    } else if (import.meta.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask.Classification}`,
      );
    }
  };
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
  const handleEvaluate = async () => {
    if (!selectedModel) return;

    const evaluationResult = await selectedModel.evaluate();
    dispatch(
      classifierSlice.actions.updateEvaluationResult({
        evaluationResult,
        kindId: activeKindId,
      }),
    );
    handleOpenEvaluateClassifierDialog();
  };

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
      //handleOpenEvaluateClassifierDialog();
    }
  }, [
    modelStatus,
    waitingForResults,
    handleOpenEvaluateClassifierDialog,
    setWaitingForResults,
  ]);
  useEffect(() => {
    if (modelStatus === ModelStatus.Trained) {
      return;
    }

    switch (modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Loading:
      case ModelStatus.Training:
        setHelperText("Disabled during training");
        break;
      case ModelStatus.Evaluating:
        // setHelperText("Evaluating...");
        break;
      case ModelStatus.Predicting:
        setHelperText("Predcting...");
        break;
      case ModelStatus.Suggesting:
        setHelperText("Accept/Reject suggested predictions first");
        break;
      default:
      //setHelperText("No Trained Model");
    }
  }, [modelStatus]);

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
          hasTrainedModel={!!selectedModel}
          handleImportModel={handleOpenImportClassifierDialog}
          handleSaveModel={handleOpenSaveClassifierDialog}
        />
        {selectedModel && (
          <Stack
            width="100%"
            py={0.5}
            borderTop={"1px solid white"}
            borderBottom={"1px solid white"}
            sx={(theme) => ({
              borderTop: `1px solid ${theme.palette.divider}`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Typography variant="caption" noWrap>
              {`Selected Model:  ${selectedModel ? selectedModel.name : "N/A"}`}
            </Typography>
          </Stack>
        )}
        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleFit={handleOpenFitClassifierDialog}
          handleEvaluate={handleEvaluate}
          modelTrainable={!selectedModel || selectedModel.trainable}
          helperText={helperText}
        />
      </Box>
      <ImportTensorflowClassificationModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
        dispatchFunction={handleImportModel}
      />
      {selectedModel && (
        <SaveFittedModelDialog
          model={selectedModel}
          modelStatus={modelStatus}
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
