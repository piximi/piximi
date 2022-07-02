import React from "react";
import { EditCategoryDialog } from "../EditCategoryDialog";
import { Category, CategoryType } from "types/Category";
import { useDialog } from "hooks";
import { MenuItem, Typography } from "@mui/material";

type EditCategoryMenuItemProps = {
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: () => void;
};

export const EditCategoryMenuItem = ({
  category,
  categoryType,
  onCloseCategoryMenu,
}: EditCategoryMenuItemProps) => {
  const {
    onClose: onCloseEditCategoryDialog,
    onOpen: onOpenEditCategoryDialog,
    open: openEditCategoryDialog,
  } = useDialog();

  const onClose = () => {
    onCloseEditCategoryDialog();
    onCloseCategoryMenu();
  };

  return (
    <>
      <MenuItem onClick={onOpenEditCategoryDialog}>
        <Typography variant="inherit">Edit category</Typography>
      </MenuItem>

      <EditCategoryDialog
        categoryType={categoryType}
        category={category}
        onClose={onClose}
        open={openEditCategoryDialog}
      />
    </>
  );
};
