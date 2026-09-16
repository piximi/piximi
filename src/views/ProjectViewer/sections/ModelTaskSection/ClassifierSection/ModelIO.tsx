import { Box } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { HotkeyContext } from "utils/enums";

import { HelpItem } from "data/help/HelpContent";

import { TooltipTextButton } from "views/ProjectViewer/components";

import { SaveFittedModelDialog } from "@ProjectViewer/components/dialogs";

import { ImportTensorflowClassificationModelDialog } from "../ImportTensorflowModelDialog";

import type { ModelInfoDTO } from "core/dl/classification/types";

export const ModelIO = ({
  selectedModelConfig,
}: {
  selectedModelConfig: ModelInfoDTO | undefined;
}) => {
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
  return (
    <>
      <Box display="flex" justifyContent="space-evenly" width="100%">
        <TooltipTextButton
          dataHelp={HelpItem.LoadClassificationModel}
          icon={<AddIcon />}
          label="Load Model"
          tooltipText="Load a saved or remote model"
          onClick={handleOpenImportClassifierDialog}
        />
        <TooltipTextButton
          dataHelp={HelpItem.SaveClassificationModel}
          icon={<SaveIcon />}
          label="Save Model"
          tooltipText={
            selectedModelConfig
              ? "Save the trained model"
              : "Select or train a model to save"
          }
          onClick={handleOpenSaveClassifierDialog}
          disabled={!selectedModelConfig}
        />
      </Box>
      <ImportTensorflowClassificationModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
      />
      {selectedModelConfig && (
        <SaveFittedModelDialog
          model={selectedModelConfig}
          onClose={handleCloseSaveClassifierDialog}
          open={SaveClassifierDialogOpen}
        />
      )}
    </>
  );
};
