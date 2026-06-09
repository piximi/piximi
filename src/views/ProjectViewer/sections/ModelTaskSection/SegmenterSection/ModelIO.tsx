import React from "react";

import { Box, Button } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useTranslation } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import type { SegmentaionModelDetails } from "utils/dl/segmentation/types";
import { useSegmenterApi } from "utils/dl/segmentation";
import { HotkeyContext } from "utils/enums";

import { LoadSegmentationModelDialog } from "./LoadSegmentationModelDialog";

export const ModelIO = () => {
  const t = useTranslation();
  const segApi = useSegmenterApi();
  const { selectedModel, setSelectedModel } = useSegmenterStatus();
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const handleImportModel = async (model: SegmentaionModelDetails) => {
    if (model.pretrained) {
      await segApi.loadModel(model.name);
    }

    setSelectedModel(model);
  };
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
        loadedModel={
          selectedModel?.name === "Fully Convolutional Network"
            ? undefined
            : selectedModel
        }
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
        dispatchFunction={handleImportModel}
      />
    </Box>
  );
};
