import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useDialog } from "hooks";

import { CreateCategoryDialog } from "components/category/dialogs/CreateCategoryDialog";

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
