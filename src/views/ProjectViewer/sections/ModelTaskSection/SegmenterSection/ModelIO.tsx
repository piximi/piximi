import React from "react";

import { Box, Button } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useTranslation } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { HotkeyContext } from "utils/enums";

import { LoadSegmentationModelDialog } from "./LoadSegmentationModelDialog";

export const ModelIO = () => {
  const t = useTranslation();
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  return (
    <Box display="flex" justifyContent="space-between" width="100%">
      <Button
        data-help={HelpItem.LoadClassificationModel}
        color="inherit"
        size="small"
        onClick={onOpenImportSegmenterDialog}
      >
        <AddIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
        {t("Load Model")}
      </Button>
      <Button
        color="inherit"
        size="small"
        onClick={() => {}}
        disabled={true}
        data-help={HelpItem.SaveClassificationModel}
      >
        <SaveIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
        {t("Save Model")}
      </Button>
      <LoadSegmentationModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
      />
    </Box>
  );
};
