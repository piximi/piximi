import React from "react";

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import AddIcon from "@mui/icons-material/Add";

import { useDialog } from "hooks";

import { NewProjectDialog } from "components/NewProjectDialog";

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
