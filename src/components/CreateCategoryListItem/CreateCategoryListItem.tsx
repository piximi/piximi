import React from "react";
import { CreateCategoryDialog } from "../CreateCategoryDialog";
import { useDialog } from "../../hooks";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export const CreateCategoryListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="Create category" />
      </ListItem>

      <CreateCategoryDialog onClose={onClose} open={open} />
    </>
  );
};
