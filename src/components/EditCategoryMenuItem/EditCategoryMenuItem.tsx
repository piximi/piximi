import React from "react";
import { EditCategoryDialog } from "../EditCategoryDialog";
import { Category } from "../../types/Category";
import { useDialog } from "../../hooks";
import { MenuItem, Typography } from "@mui/material";

type EditCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const EditCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: EditCategoryMenuItemProps) => {
  const { onClose, onOpen, open } = useDialog();

  const onClick = () => {
    onCloseCategoryMenu();

    onOpen();
  };

  return (
    <>
      <MenuItem onClick={onClick}>
        <Typography variant="inherit">Edit category</Typography>
      </MenuItem>

      <EditCategoryDialog category={category} onClose={onClose} open={open} />
    </>
  );
};
