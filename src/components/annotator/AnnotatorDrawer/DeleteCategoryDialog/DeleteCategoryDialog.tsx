import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  annotatorImagesSelector,
  selectedCategorySelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { AnnotationType, ShadowImageType } from "types";

type DeleteCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const DeleteCategoryDialog = ({
  onClose,
  open,
}: DeleteCategoryDialogProps) => {
  const dispatch = useDispatch();

  const selectedCategory = useSelector(selectedCategorySelector);

  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const images = useSelector(annotatorImagesSelector);

  const onDelete = () => {
    images.forEach((image: ShadowImageType) => {
      const instances = image.annotations.map((instance: AnnotationType) => {
        if (instance.categoryId === selectedCategory.id) {
          return {
            ...instance,
            categoryId: unknownAnnotationCategory.id,
          };
        } else {
          return instance;
        }
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
        imageViewerSlice.actions.deleteCategory({ category: selectedCategory })
      );
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: unknownAnnotationCategory.id,
        })
      );
    });
    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete "{selectedCategory.name}" category?</DialogTitle>

      <DialogContent>
        Annotations categorized as "{selectedCategory.name}" will not be deleted
        and instead will be labeled as "{unknownAnnotationCategory.name}".
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
