import React from "react";
import DownloadIcon from "@mui/icons-material/Download";

import { useDialogHotkey } from "hooks";

import { CustomListItemButton } from "components/CustomListItemButton";
import { SaveProjectDialog } from "sections/dialogs";

import { HotkeyContext } from "utils/common/enums";

export const SaveProjectListItem = () => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  return (
    <>
      <CustomListItemButton
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
