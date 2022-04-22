import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { batch, useDispatch, useSelector } from "react-redux";
import { AnnotationType } from "../../../../types/AnnotationType";
import { imageViewerSlice } from "../../../../store/slices";
import {
  selectedCategorySelector,
  unknownCategorySelector,
} from "../../../../store/selectors";
import { UNKNOWN_CATEGORY_ID } from "../../../../types/Category";
import { ShadowImageType } from "types/ImageType";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";

type DeleteCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const DeleteCategoryDialog = ({
  onClose,
  open,
}: DeleteCategoryDialogProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const unknownCategory = useSelector(unknownCategorySelector);

  const images = useSelector(annotatorImagesSelector);

  const onDelete = () => {
    images.forEach((image: ShadowImageType) => {
      const instances = image.annotations.map((instance: AnnotationType) => {
        if (instance.categoryId === category.id) {
          return {
            ...instance,
            categoryId: UNKNOWN_CATEGORY_ID,
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
      dispatch(imageViewerSlice.actions.deleteCategory({ category: category }));
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_CATEGORY_ID,
        })
      );
    });
    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete "{category.name}" category?</DialogTitle>

      <DialogContent>
        Annotations categorized as "{category.name}" will not be deleted and
        instead will be labeled as "{unknownCategory.name}".
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
