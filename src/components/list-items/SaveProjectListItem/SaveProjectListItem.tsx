import React from "react";

import DownloadIcon from "@mui/icons-material/Download";

import { useDialog } from "hooks";
import { CustomListItemButton } from "../CustomListItemButton";
import { SaveProjectDialog } from "components/dialogs";

export const SaveProjectListItem = () => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialog();

  return (
    <>
      <CustomListItemButton
        primaryText="Save Project"
        onClick={onSaveProjectDialogOpen}
        icon={<DownloadIcon />}
      />

      <SaveProjectDialog
        onClose={onSaveProjectDialogClose}
        open={openSaveProjectDialog}
      />
    </>
  );
};
