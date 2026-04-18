import React from "react";
import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { NewProjectDialog } from "../dialogs";

import { HotkeyContext } from "utils/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const NewProjectListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.ConfirmationDialog,
  );

  return (
    <>
      <CustomListItemButton
        data-help={HelpItem.StartNewProject}
        primaryText="New"
        onClick={onOpen}
        icon={<AddIcon />}
        tooltipText="New Project"
      />

      <NewProjectDialog onClose={onClose} open={open} />
    </>
  );
};
