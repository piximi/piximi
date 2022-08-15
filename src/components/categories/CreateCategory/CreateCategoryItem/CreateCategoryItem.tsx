import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useDialog } from "hooks";

import { CreateCategoryDialog } from "../CreateCategoryDialog";

import { CategoryType } from "types";

type CreateCategoryItemProps = {
  categoryType: CategoryType;
};

export const CreateCategoryItem = (props: CreateCategoryItemProps) => {
  const { categoryType } = props;

  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="Create category" />
      </ListItem>

      <CreateCategoryDialog
        categoryType={categoryType}
        onClose={onClose}
        open={open}
      />
    </>
  );
};
