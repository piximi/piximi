import React, { useEffect } from "react";

import { Box, Stack, Typography } from "@mui/material";

import { useDialogHotkey, useSegmentationModel } from "hooks";

import { ModelIOButtonGroup } from "./ModelIOButtonGroup";
import { ModelExecButtonGroup } from "./ModelExecButtonGroup";
import { ImportTensorflowSegmentationModelDialog } from "./ImportTensorflowModelDialog";

import { HotkeyContext } from "utils/common/enums";
import { ModelStatus } from "utils/models/enums";

export const SegmenterSection = () => {
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
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
    }
  }, [modelStatus, waitingForResults, setWaitingForResults]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        width="100%"
        px={1}
      >
        <ModelIOButtonGroup
          hasTrainedModel={false}
          handleImportModel={onOpenImportSegmenterDialog}
          handleSaveModel={() => {}}
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
            <Typography variant="caption" noWrap>
              {`Model Kind:  ${selectedModel.kind ?? "N/A"}`}
            </Typography>
          </Stack>
        )}
        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleEvaluate={handleEvaluate}
          handleFit={() => {}}
          handlePredict={handlePredict}
          modelTrainable={false} //until trainable segmenter available
          helperText={helperText}
        />
      </Box>

      <ImportTensorflowSegmentationModelDialog
        loadedModel={
          selectedModel?.name === "Fully Convolutional Network"
            ? undefined
            : selectedModel
        }
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
        dispatchFunction={handleImportModel}
      />
    </>
  );
};
