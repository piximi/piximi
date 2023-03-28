import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

import { imageViewerSlice } from "store/imageViewer";
import {
  dataSlice,
  selectImageCountByCategory,
  selectAnnotationCountByCategory,
} from "store/data";

import {
  Category,
  CategoryType,
  HotkeyView,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
} from "types";

type DeleteCategoryMenuItemProps = {
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: () => void;
};

export const DeleteCategoryMenuItem = ({
  category,
  categoryType,
  onCloseCategoryMenu,
}: DeleteCategoryMenuItemProps) => {
  const dispatch = useDispatch();
  const imageCount = useSelector(selectImageCountByCategory(category.id));
  const annotationCount = useSelector(
    selectAnnotationCountByCategory(category.id)
  );

  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialogHotkey(HotkeyView.DeleteCategoryDialog);

  const {
    onClose: onCloseDeleteAnnotationCategoryDialog,
    onOpen: onOpenDeleteAnnotationCategoryDialog,
    open: openDeleteAnnotationCategoryDialog,
  } = useDialogHotkey(HotkeyView.DeleteAnnotationCategoryDialog);

  const onDeleteCategory = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    if (categoryType === CategoryType.ClassifierCategory) {
      deleteClassificationCategory();
    } else {
      deleteAnnotationCategory();
    }
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

  const deleteAnnotationCategory = () => {
    if (annotationCount) {
      onOpenDeleteAnnotationCategoryDialog();
    } // Warn user that these annotations will be relabeled as unknown.
    else {
      deleteAnnotationCategoryCallback(category.id);
    }
  };

  const deleteAnnotationCategoryCallback = (categoryId: string) => {
    dispatch(
      dataSlice.actions.deleteAnnotationCategory({ categoryId: category.id })
    );
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
    if (categoryType === CategoryType.ClassifierCategory) {
      onCloseDeleteCategoryDialog();
    } else {
      onCloseDeleteAnnotationCategoryDialog();
    }

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
        categoryType={categoryType}
        onClose={onClose}
        open={openDeleteCategoryDialog}
      />

      <DeleteCategoryDialog
        category={category}
        deleteCategoryCallback={deleteAnnotationCategoryCallback}
        categoryType={categoryType}
        onClose={onClose}
        open={openDeleteAnnotationCategoryDialog}
      />
    </>
  );
};
