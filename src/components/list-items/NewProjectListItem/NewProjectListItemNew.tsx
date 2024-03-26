import React from "react";

import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { HotkeyView } from "types";
import { CustomListItemButton } from "../CustomListItemButton";
import { NewProjectDialogNew } from "components/dialogs/NewProjectDialog/NewProjectDialogNew";

export const NewProjectListItemNew = () => {
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

      <NewProjectDialogNew onClose={onClose} open={open} />
    </>
  );
};
