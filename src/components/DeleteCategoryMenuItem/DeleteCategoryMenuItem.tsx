import React from "react";

import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import { useDialog } from "hooks";

import { DeleteCategoryDialog } from "components/DeleteCategoryDialog";

import { Category } from "types/Category";

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
