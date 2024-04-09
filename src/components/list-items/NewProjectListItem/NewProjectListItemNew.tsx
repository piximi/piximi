import React from "react";

import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { HotkeyView } from "utils/common/enums";
import { CustomListItemButton } from "../CustomListItemButton";
import { NewProjectDialogNew } from "components/dialogs";

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
