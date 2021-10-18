import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import AddIcon from "@mui/icons-material/Add";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { NewClassifierDialog } from "../NewClassifierDialog";
import { useDialog } from "../../hooks";

export const NewClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="New classifier…" />
      </ListItem>

      <NewClassifierDialog onClose={onClose} open={open} />
    </>
  );
};
