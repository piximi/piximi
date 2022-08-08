import React from "react";

import { MenuItem, Typography } from "@mui/material";

import { useDialog } from "hooks";

import { DeleteCategoryDialog } from "../dialogs/DeleteCategoryDialog";

import { Category } from "types";

type DeleteCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const DeleteCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: DeleteCategoryMenuItemProps) => {
  const { onClose, onOpen, open } = useDialog();

  const onClick = () => {
    onCloseCategoryMenu();

    onOpen();
  };

  return (
    <>
      <MenuItem onClick={onClick}>
        <Typography variant="inherit">Delete category</Typography>
      </MenuItem>

      <DeleteCategoryDialog category={category} onClose={onClose} open={open} />
    </>
  );
};
