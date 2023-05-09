import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { useDialogHotkey } from "hooks";

import { NewProjectDialog } from "../../dialogs/NewProjectDialog";
import { HotkeyView } from "types";

export const NewProjectListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyView.NewProjectDialog
  );

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="New project" />
      </ListItem>

      <NewProjectDialog onClose={onClose} open={open} />
    </>
  );
};
