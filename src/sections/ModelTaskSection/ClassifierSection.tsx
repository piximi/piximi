import React, { useEffect } from "react";

import { Box, Stack, Typography } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "sections/dialogs";
import {
  SaveFittedModelDialog,
  EvaluateClassifierDialog,
  FitClassifierDialog,
} from "sections/dialogs";

import { ModelExecButtonGroup } from "sections/ModelTaskSection/ModelExecButtonGroup";

import { ModelIOButtonGroup } from "sections/ModelTaskSection/ModelIOButtonGroup";
import { useClassificationModel } from "hooks/useLearningModel/useClassifierModel";
import { HotkeyContext } from "utils/common/enums";
import { ModelStatus, ModelTask } from "utils/models/enums";

export const ClassifierSection = () => {
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
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        px={1}
        gap={1}
      >
        <ModelIOButtonGroup
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
              {`Selected Model:  ${selectedModel.name}`}
            </Typography>
          </Stack>
        )}
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
