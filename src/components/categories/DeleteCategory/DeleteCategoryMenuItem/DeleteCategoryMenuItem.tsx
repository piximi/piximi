import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

import { AnnotatorSlice } from "store/annotator";
import { imagesSelector, projectSlice } from "store/project";

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
  const images = useSelector(imagesSelector);

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
    let existImages = false;
    for (let i = 0; i < images.length; i++) {
      if (!existImages) {
        if (images[i].categoryId === category.id) {
          existImages = true;
          break;
        }
      }
    }

    if (existImages) {
      onOpenDeleteCategoryDialog();
    } // Warn user that these images will be relabeled as unknown.
    else {
      deleteClassificationCategoryCallback(category.id);
    }
  };

  const deleteClassificationCategoryCallback = (categoryId: string) => {
    dispatch(
      projectSlice.actions.deleteCategory({
        id: categoryId,
      })
    );
  };

  const deleteAnnotationCategory = () => {
    // Cycle through the annotations to determine if annotations of that category exist, show a warning dialog box is they do exist.
    let existAnnotations = false;
    for (let i = 0; i < images.length; i++) {
      if (!existAnnotations) {
        for (let j = 0; j < images[i].annotations.length; j++) {
          if (images[i].annotations[j].categoryId === category.id) {
            existAnnotations = true;
            break;
          }
        }
      } else {
        break;
      }
    }

    if (existAnnotations) {
      onOpenDeleteAnnotationCategoryDialog();
    } // Warn user that these annotations will be relabeled as unknown.
    else {
      deleteAnnotationCategoryCallback(category.id);
    }
  };

  const deleteAnnotationCategoryCallback = (categoryId: string) => {
    batch(() => {
      dispatch(
        AnnotatorSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
          execSaga: true,
        })
      );

      dispatch(
        AnnotatorSlice.actions.deleteAnnotationCategory({
          categoryID: categoryId,
        })
      );

      dispatch(
        projectSlice.actions.deleteAnnotationCategory({
          categoryID: categoryId,
          execSaga: true,
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
