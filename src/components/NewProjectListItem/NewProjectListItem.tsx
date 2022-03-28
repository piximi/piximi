import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import AddIcon from "@mui/icons-material/Add";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { NewProjectDialog } from "../NewProjectDialog";
import { useDialog } from "../../hooks";

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
