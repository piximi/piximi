import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

import { dataSlice, selectImageCountByCategory } from "store/data";

import { Category, CategoryType, HotkeyView } from "types";

type DeleteCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const DeleteCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: DeleteCategoryMenuItemProps) => {
  const memoizedSelectImageCountByCategory = useMemo(
    selectImageCountByCategory,
    []
  );
  const dispatch = useDispatch();
  const imageCount = useSelector((state) =>
    memoizedSelectImageCountByCategory(state, category.id)
  );

  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialogHotkey(HotkeyView.DeleteCategoryDialog);

  const onDeleteCategory = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    deleteClassificationCategory();
  };

  const deleteClassificationCategory = () => {
    if (imageCount) {
      onOpenDeleteCategoryDialog();
    } // Warn user that these images will be relabeled as unknown.
    else {
      deleteClassificationCategoryCallback(category.id);
    }
  };

  const deleteClassificationCategoryCallback = (categoryId: string) => {
    dispatch(
      dataSlice.actions.deleteCategory({
        categoryId: categoryId,
      })
    );
  };

  const onClose = () => {
    onCloseDeleteCategoryDialog();

    onCloseCategoryMenu();
  };

  return (
    <>
      <MenuItem onClick={(event) => onDeleteCategory(event)}>
        <Typography variant="inherit">Delete category</Typography>
      </MenuItem>

      <DeleteCategoryDialog
        category={category}
        deleteCategoryCallback={deleteClassificationCategoryCallback}
        categoryType={CategoryType.ClassifierCategory}
        onClose={onClose}
        open={openDeleteCategoryDialog}
      />
    </>
  );
};
