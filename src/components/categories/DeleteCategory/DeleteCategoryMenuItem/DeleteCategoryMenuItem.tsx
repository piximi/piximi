import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { useDialog } from "hooks";

import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

import { imageViewerSlice } from "store/image-viewer";
import { imagesSelector, projectSlice } from "store/project";

import { Category, CategoryType, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";

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
  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialog();
  const {
    onClose: onCloseDeleteAnnotationCategoryDialog,
    onOpen: onOpenDeleteAnnotationCategoryDialog,
    open: openDeleteAnnotationCategoryDialog,
  } = useDialog();

  const dispatch = useDispatch();

  const images = useSelector(imagesSelector);

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
      onClose();
    }
  };

  const deleteClassificationCategoryCallback = (categoryID: string) => {
    dispatch(
      projectSlice.actions.deleteCategory({
        id: categoryID,
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
      onClose();
    }
  };

  const deleteAnnotationCategoryCallback = (categoryID: string) => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
          execSaga: true,
        })
      );

      dispatch(
        imageViewerSlice.actions.deleteAnnotationCategory({
          categoryID: categoryID,
        })
      );

      dispatch(
        projectSlice.actions.deleteAnnotationCategory({
          categoryID: categoryID,
        })
      );
    });
  };

  const onClose = () => {
    onCloseDeleteCategoryDialog();
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
