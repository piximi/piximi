import React from "react";
import { Download as DownloadIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { SaveProjectDialog } from "components/dialogs";

import { HotkeyContext } from "utils/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const SaveProjectListItem = () => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  return (
    <>
      <CustomListItemButton
        data-help={HelpItem.SaveProject}
        primaryText="Save"
        onClick={onSaveProjectDialogOpen}
        icon={<DownloadIcon />}
        tooltipText="Save Project"
      />

      <SaveProjectDialog
        onClose={onSaveProjectDialogClose}
        open={openSaveProjectDialog}
      />
    </>
  );
};
