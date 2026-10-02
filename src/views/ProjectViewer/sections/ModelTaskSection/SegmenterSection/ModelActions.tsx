import { useMemo } from "react";

import { Box, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { TooltipTextButton } from "components/inputs";

import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

import { usePredictSegmenter, useSegmenter } from "@ProjectViewer/hooks";

import { SectionHeader } from "./SectionHeader";
import { LoadSegmentationModelDialog } from "./LoadSegmentationModelDialog";

export const ModelActions = () => {
  const predictSegmenter = usePredictSegmenter();
  const { modelStatus, error, loadedModel } = useSegmenter();

  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const predictInfo = useMemo(() => {
    let predictText: string;

    switch (modelStatus) {
      case "idle":
        predictText = error
          ? error.message
          : loadedModel
            ? "Predict Model"
            : "No Trained Model";
        break;
      case "predicting":
        predictText = "...Predicting";
        break;
      default:
        predictText = "...Pending";
    }
    return {
      helperText: predictText,
      disabled: !loadedModel || !!error || modelStatus === "predicting",
    };
  }, [modelStatus, loadedModel, error]);
  return (
    <>
      <SectionHeader
        title="Selected Model"
        action={
          <TooltipTextButton
            dataHelp={HelpItem.LoadClassificationModel}
            label="Select Model"
            tooltipText="Load a pre-trained model"
            onClick={onOpenImportSegmenterDialog}
            sx={{
              font: "var(--mui-font-caption)",
              color: "var(--mui-palette-primary-main)",
              textTransform: "none",
            }}
          />
        }
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",

          px: 1,
        }}
      >
        <Typography
          variant="caption"
          noWrap
          sx={{ display: "block", lineHeight: 1.6 }}
        >
          {`${loadedModel ? loadedModel.name : "No Selected Model"}`}
        </Typography>
        <TooltipTextButton
          tooltipText={predictInfo.helperText}
          onClick={predictSegmenter}
          disabled={predictInfo.disabled}
          label="Run Segmentation"
          sx={{
            font: "var(--mui-font-caption)",
            color: "var(--mui-palette-primary-main)",
          }}
        />
      </Box>
      <LoadSegmentationModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
      />
    </>
  );
};
