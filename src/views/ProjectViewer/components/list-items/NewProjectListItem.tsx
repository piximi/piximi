import React from "react";
import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { NewProjectDialog } from "../dialogs";

import { HotkeyContext } from "utils/enums";

export const NewProjectListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.ConfirmationDialog,
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
