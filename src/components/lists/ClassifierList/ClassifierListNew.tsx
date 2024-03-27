import React, { useEffect } from "react";

import { Box } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "components/dialogs";
import { SaveFittedModelDialog } from "components/dialogs";

import { ModelStatus, ModelTask } from "types/ModelType";
import { ModelExecButtonGroup } from "components/list-items/ClassifierExecListItem/ModelExecButtonGroup";

import { ModelIOButtonGroup } from "components/list-items/ModelIOButtonGroup/ModelIOButtonGroup";
import { useClassificationModel } from "hooks/useLearningModel/useClassifierModel";
import { EvaluateClassifierDialogNew } from "components/dialogs/EvaluateClassifierDialog/EvaluateClassifierDialogNew";
import { HotkeyView } from "types";
import { FitClassifierDialogNew } from "components/dialogs/FitClassifierDialog/FitClassifierDialogNew";

export const ClassifierListNew = () => {
  const {
    modelStatus,
    selectedModel,
    handlePredict,
    handleEvaluate,
    helperText,
    waitingForResults,
    setWaitingForResults,
    handleImportModel,
  } = useClassificationModel();
  const {
    onClose: handleCloseEvaluateClassifierDialog,
    onOpen: handleOpenEvaluateClassifierDialog,
    open: evaluateClassifierDialogOpen,
  } = useDialog();

  const {
    onClose: handleCloseImportClassifierDialog,
    onOpen: handleOpenImportClassifierDialog,
    open: ImportClassifierDialogOpen,
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);
  const {
    onClose: handleCloseSaveClassifierDialog,
    onOpen: handleOpenSaveClassifierDialog,
    open: SaveClassifierDialogOpen,
  } = useDialog();
  const {
    onClose: handleCloseFitClassifierDialog,
    onOpen: handleOpenFitClassifierDialog,
    open: fitClassifierDialogOpen,
  } = useDialogHotkey(HotkeyView.Classifier, false);

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
      handleOpenEvaluateClassifierDialog();
    }
  }, [
    modelStatus,
    waitingForResults,
    handleOpenEvaluateClassifierDialog,
    setWaitingForResults,
  ]);

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <ModelIOButtonGroup
          handleImportModel={handleOpenImportClassifierDialog}
          handleSaveModel={handleOpenSaveClassifierDialog}
        />

        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleEvaluate={handleEvaluate}
          handleFit={handleOpenFitClassifierDialog}
          handlePredict={handlePredict}
          modelTrainable={selectedModel.trainable}
          helperText={helperText}
        />
      </Box>
      <ImportTensorflowModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
        modelTask={ModelTask.Classification}
        dispatchFunction={handleImportModel}
      />
      <SaveFittedModelDialog
        model={selectedModel}
        modelStatus={modelStatus}
        onClose={handleCloseSaveClassifierDialog}
        open={SaveClassifierDialogOpen}
      />
      <FitClassifierDialogNew
        openedDialog={fitClassifierDialogOpen}
        closeDialog={handleCloseFitClassifierDialog}
      />
      <EvaluateClassifierDialogNew
        openedDialog={evaluateClassifierDialogOpen}
        closeDialog={handleCloseEvaluateClassifierDialog}
      />
    </>
  );
};
