import { Box } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { HotkeyContext } from "utils/enums";

import { HelpItem } from "data/help/HelpContent";

import { TooltipTextButton } from "views/ProjectViewer/components";

import { LoadSegmentationModelDialog } from "./LoadSegmentationModelDialog";

export const ModelIO = () => {
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  return (
    <Box display="flex" justifyContent="space-evenly" width="100%">
      <TooltipTextButton
        dataHelp={HelpItem.LoadClassificationModel}
        icon={<AddIcon />}
        label="Load Model"
        tooltipText="Load a pre-trained model"
        onClick={onOpenImportSegmenterDialog}
      />
      <TooltipTextButton
        dataHelp={HelpItem.SaveClassificationModel}
        icon={<SaveIcon />}
        label="Save Model"
        tooltipText="Cannot save segmentation models"
        onClick={() => {}}
        disabled={true}
      />

      <LoadSegmentationModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
      />
    </Box>
  );
};
