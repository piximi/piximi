import React from "react";

import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { NewProjectDialog } from "components/dialogs";
import { HotkeyView } from "types";
import { CustomListItemButton } from "../CustomListItemButton";

export const NewProjectListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyView.NewProjectDialog
  );

  return (
    <>
      <CustomListItemButton
        primaryText="New"
        onClick={onOpen}
        icon={<AddIcon />}
        tooltipText="New Project"
      />

      <NewProjectDialog onClose={onClose} open={open} />
    </>
  );
};
