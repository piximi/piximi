import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { AnnotationType } from "../../../../types/AnnotationType";
import { imageViewerSlice } from "../../../../store/slices";
import {
  imageInstancesSelector,
  selectedCategorySelector,
  unknownCategorySelector,
} from "../../../../store/selectors";
import { activeImageIdSelector } from "../../../../store/selectors/activeImageIdSelector";

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

  const selections = useSelector(imageInstancesSelector);

  const unknownCategory = useSelector(unknownCategorySelector);

  const activeImageId = useSelector(activeImageIdSelector);

  const onDelete = () => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategory({
        selectedCategory: "00000000-0000-0000-0000-000000000000",
      })
    );

    const instances = selections?.map((instance: AnnotationType) => {
      if (instance.categoryId === category.id) {
        return {
          ...instance,
          categoryId: "00000000-0000-0000-0000-000000000000",
        };
      } else {
        return instance;
      }
    });

    if (!activeImageId) return;

    dispatch(
      imageViewerSlice.actions.setImageInstances({
        instances: instances as Array<AnnotationType>,
        imageId: activeImageId,
      })
    );

    dispatch(imageViewerSlice.actions.deleteCategory({ category: category }));

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
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
