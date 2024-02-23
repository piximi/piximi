import React, { useEffect } from "react";

import { Box } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import {
  FitClassifierDialog,
  ImportTensorflowModelDialog,
} from "components/dialogs";
import { SaveFittedModelDialog } from "components/dialogs";

import { ModelStatus, ModelTask } from "types/ModelType";
import { ModelExecButtonGroupNew } from "components/list-items/ClassifierExecListItem/ModelExecButtonGroupNew";

import { ModelIOButtonGroup } from "components/list-items/ModelIOButtonGroup/ModelIOButtonGroup";
import { useClassificationModel } from "hooks/useLearningModel/useClassifierModel";
import { EvaluateClassifierDialogNew } from "components/dialogs/EvaluateClassifierDialog/EvaluationClassifierDialogNew";
import { HotkeyView } from "types";

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
    onClose: handleCloseEval,
    onOpen: handleOpenEval,
    open: evalOpen,
  } = useDialog();

  const {
    onClose: onCloseImportClassifierDialog,
    onOpen: onOpenImportClassifierDialog,
    open: openImportClassifierDialog,
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);
  const {
    onClose: onCloseSaveClassifierDialog,
    onOpen: onOpenSaveClassifierDialog,
    open: openSaveClassifierDialog,
  } = useDialog();
  const {
    onClose: handleCloseFitModelDialog,
    onOpen: handleOpenFitModelDialog,
    open: fittingOpen,
  } = useDialogHotkey(HotkeyView.Classifier, false);

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
      handleOpenEval();
    }
  }, [modelStatus, waitingForResults, handleOpenEval, setWaitingForResults]);

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <ModelIOButtonGroup
          handleImportModel={onOpenImportClassifierDialog}
          handleSaveModel={onOpenSaveClassifierDialog}
        />

        <ModelExecButtonGroupNew
          modelStatus={modelStatus}
          handleEvaluate={handleEvaluate}
          handleFit={handleOpenFitModelDialog}
          handlePredict={handlePredict}
          helperText={helperText}
        />
      </Box>
      <ImportTensorflowModelDialog
        onClose={onCloseImportClassifierDialog}
        open={openImportClassifierDialog}
        modelTask={ModelTask.Classification}
        dispatchFunction={handleImportModel}
      />
      <SaveFittedModelDialog
        model={selectedModel}
        modelStatus={modelStatus}
        onClose={onCloseSaveClassifierDialog}
        open={openSaveClassifierDialog}
      />
      <FitClassifierDialog
        openedDialog={fittingOpen}
        closeDialog={handleCloseFitModelDialog}
      />
      <EvaluateClassifierDialogNew
        openedDialog={evalOpen}
        closeDialog={handleCloseEval}
      />
    </>
  );
};
