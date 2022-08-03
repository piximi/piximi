import React from "react";

import { MenuItem, Typography } from "@mui/material";

import { useDialog } from "hooks";

import { EditCategoryDialog } from "components/EditCategoryDialog";

import { Category } from "types";

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
