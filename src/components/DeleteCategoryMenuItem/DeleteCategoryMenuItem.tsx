import React from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Category } from "../../types/Category";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";
import { useDialog } from "../../hooks";

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
