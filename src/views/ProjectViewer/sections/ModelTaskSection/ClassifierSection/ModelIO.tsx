import { Box, Button } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey, useTranslation } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { SaveFittedModelDialog } from "components/dialogs";

import { HotkeyContext } from "utils/enums";
import type { ModelInfoDTO } from "utils/dl/classification/types";

import { ImportTensorflowClassificationModelDialog } from "../ImportTensorflowModelDialog";

export const ModelIO = ({
  selectedModelConfig,
}: {
  selectedModelConfig: ModelInfoDTO | undefined;
}) => {
  const t = useTranslation();

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
      <Box display="flex" justifyContent="space-between" width="100%">
        <Button
          data-help={HelpItem.LoadClassificationModel}
          color="inherit"
          size="small"
          onClick={handleOpenImportClassifierDialog}
        >
          <AddIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
          {t("Load Model")}
        </Button>
        <Button
          color="inherit"
          size="small"
          onClick={handleOpenSaveClassifierDialog}
          disabled={!selectedModelConfig}
          data-help={HelpItem.SaveClassificationModel}
        >
          <SaveIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
          {t("Save Model")}
        </Button>
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
