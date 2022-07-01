import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { batch, useDispatch, useSelector } from "react-redux";
import { AnnotationType } from "types/AnnotationType";
import { imageViewerSlice, projectSlice } from "store/slices";
import {
  selectedCategorySelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";
import { ShadowImageType } from "types/ImageType";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";

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
        projectSlice.actions.deleteAnnotationCategory({
          category: selectedCategory,
        })
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
