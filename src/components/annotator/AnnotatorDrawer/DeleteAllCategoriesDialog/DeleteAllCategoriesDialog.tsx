import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { annotatorImagesSelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

import {
  AnnotationType,
  UNKNOWN_ANNOTATION_CATEGORY,
  ShadowImageType,
} from "types";

type DeleteAllCategoriesDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const DeleteAllCategoriesDialog = ({
  onClose,
  open,
}: DeleteAllCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const images = useSelector(annotatorImagesSelector);

  const onDelete = () => {
    images.forEach((image: ShadowImageType) => {
      const instances = image.annotations.map((instance: AnnotationType) => {
        return {
          ...instance,
          categoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
        };
      });
      dispatch(
        imageViewerSlice.actions.setImageInstances({
          instances: instances as Array<AnnotationType>,
          imageId: image.id,
        })
      );
    });

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
        })
      );

      dispatch(
        imageViewerSlice.actions.setCategories({
          categories: [UNKNOWN_ANNOTATION_CATEGORY],
        })
      );
    });
    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete all categories?</DialogTitle>

      <DialogContent>
        Annotations will not be deleted and instead will be labeled as "
        {UNKNOWN_ANNOTATION_CATEGORY.name}".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onDelete} color="primary">
          Delete category
        </Button>
      </DialogActions>
    </Dialog>
  );
};
