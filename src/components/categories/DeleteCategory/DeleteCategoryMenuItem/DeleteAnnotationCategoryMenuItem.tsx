import React, { useMemo } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

import { imageViewerSlice } from "store/imageViewer";
import { dataSlice, selectAnnotationCountByCategory } from "store/data";

import {
  Category,
  CategoryType,
  HotkeyView,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
} from "types";

type DeleteCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const DeleteAnnotationCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: DeleteCategoryMenuItemProps) => {
  const memoizedSelectAnnotationCountByCategory = useMemo(
    selectAnnotationCountByCategory,
    []
  );
  const dispatch = useDispatch();
  const annotationCount = useSelector((state) =>
    memoizedSelectAnnotationCountByCategory(state, category.id)
  );

  const {
    onClose: onCloseDeleteAnnotationCategoryDialog,
    onOpen: onOpenDeleteAnnotationCategoryDialog,
    open: openDeleteAnnotationCategoryDialog,
  } = useDialogHotkey(HotkeyView.DeleteAnnotationCategoryDialog);

  const onDeleteCategory = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    deleteAnnotationCategory();
  };

  const deleteAnnotationCategory = () => {
    if (annotationCount) {
      onOpenDeleteAnnotationCategoryDialog();
    } // Warn user that these annotations will be relabeled as unknown.
    else {
      deleteAnnotationCategoryCallback(category.id);
    }
  };

  const deleteAnnotationCategoryCallback = (categoryId: string) => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
          execSaga: true,
        })
      );

      dispatch(
        dataSlice.actions.deleteAnnotationCategory({
          categoryId: categoryId,
        })
      );
    });
  };

  const onClose = () => {
    onCloseDeleteAnnotationCategoryDialog();

    onCloseCategoryMenu();
  };

  return (
    <>
      <MenuItem onClick={(event) => onDeleteCategory(event)}>
        <Typography variant="inherit">Delete category</Typography>
      </MenuItem>

      <DeleteCategoryDialog
        category={category}
        deleteCategoryCallback={deleteAnnotationCategoryCallback}
        categoryType={CategoryType.AnnotationCategory}
        onClose={onClose}
        open={openDeleteAnnotationCategoryDialog}
      />
    </>
  );
};
