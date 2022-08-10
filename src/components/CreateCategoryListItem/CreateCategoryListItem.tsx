import React from "react";
import { CreateCategoryDialog } from "../CreateCategoryDialog";
import { useDialog } from "hooks";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CategoryType } from "types/Category";

type CreateCategoryListItemProps = {
  categoryType: CategoryType;
};

export const CreateCategoryListItem = (props: CreateCategoryListItemProps) => {
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
