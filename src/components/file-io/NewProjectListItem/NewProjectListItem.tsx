import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { useDialog } from "hooks";

import { NewProjectDialog } from "components/file-io/dialogs/NewProjectDialog";

export const NewProjectListItem = () => {
  const { onClose, onOpen, open } = useDialog();

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
