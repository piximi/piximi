import React from "react";

import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { HotkeyContext } from "utils/common/enums";
import { NewProjectDialog } from "sections/dialogs";
import { CustomListItemButton } from "components/CustomListItemButton";

export const NewProjectListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.ConfirmationDialog
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
