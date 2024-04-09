import React, { useEffect } from "react";

import { Box } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import {
  ImportTensorflowModelDialog,
  SaveFittedModelDialog,
} from "components/dialogs";

import { HotkeyView } from "utils/common/enums";
import { ModelIOButtonGroup } from "components/list-items/ModelIOButtonGroup/ModelIOButtonGroup";
import { ModelExecButtonGroup } from "components/list-items/ClassifierExecListItem/ModelExecButtonGroup";
import { useSegmentationModel } from "hooks/useLearningModel/useSegmentationModel";
import { FitSegmenterDialogNew } from "components/dialogs";
import { ModelStatus, ModelTask } from "utils/models/enums";

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
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <ModelIOButtonGroup
          handleImportModel={onOpenImportSegmenterDialog}
          handleSaveModel={onOpenSaveSegmenterDialog}
        />

        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleEvaluate={handleEvaluate}
          handleFit={handleOpenFitModelDialog}
          handlePredict={handlePredict}
          modelTrainable={false} //until trainable segmenter available
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
      <FitSegmenterDialogNew
        openedDialog={fittingOpen}
        closeDialog={handleCloseFitModelDialog}
      />
    </>
  );
};
