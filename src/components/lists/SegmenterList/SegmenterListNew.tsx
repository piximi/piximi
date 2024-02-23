import React, { useEffect } from "react";

import { Box } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import {
  FitSegmenterDialog,
  ImportTensorflowModelDialog,
  SaveFittedModelDialog,
} from "components/dialogs";

import { HotkeyView } from "types";
import { ModelStatus, ModelTask } from "types/ModelType";
import { ModelIOButtonGroup } from "components/list-items/ModelIOButtonGroup/ModelIOButtonGroup";
import { ModelExecButtonGroupNew } from "components/list-items/ClassifierExecListItem/ModelExecButtonGroupNew";
import { useSegmentationModel } from "hooks/useLearningModel/useSegmentationModel";

export const SegmenterListNew = () => {
  const {
    modelStatus,
    selectedModel,
    handlePredict,
    handleEvaluate,
    helperText,
    waitingForResults,
    setWaitingForResults,
    handleImportModel,
  } = useSegmentationModel();

  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: openImportSegmenterDialog,
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);

  const {
    onClose: onCloseSaveSegmenterDialog,
    onOpen: onOpenSaveSegmenterDialog,
    open: openSaveSegmenterDialog,
  } = useDialog();
  const {
    onClose: handleCloseFitModelDialog,
    onOpen: handleOpenFitModelDialog,
    open: fittingOpen,
  } = useDialogHotkey(HotkeyView.Segmenter, false);
  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
    }
  }, [modelStatus, waitingForResults, setWaitingForResults]);

  return (
    <>
      <Box>
        <ModelIOButtonGroup
          handleImportModel={onOpenImportSegmenterDialog}
          handleSaveModel={onOpenSaveSegmenterDialog}
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
        onClose={onCloseImportSegmenterDialog}
        open={openImportSegmenterDialog}
        modelTask={ModelTask.Segmentation}
        dispatchFunction={handleImportModel}
      />
      <SaveFittedModelDialog
        model={selectedModel}
        modelStatus={modelStatus}
        onClose={onCloseSaveSegmenterDialog}
        open={openSaveSegmenterDialog}
      />
      <FitSegmenterDialog
        openedDialog={fittingOpen}
        closeDialog={handleCloseFitModelDialog}
      />
    </>
  );
};
