import { useDispatch, useSelector } from "react-redux";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { activeImageIdSelector } from "store/annotator";

import { DataSlice } from "store/data";

import { Category } from "types";

type ClearAnnotationDialogProps = {
  category: Category;
  onClose: () => void;
  open: boolean;
};

export const ClearAnnotationDialog = ({
  category,
  onClose,
  open,
}: ClearAnnotationDialogProps) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(activeImageIdSelector);

  const onClear = () => {
    dispatch(
      DataSlice.actions.deleteStagedAnnotationsByCategory({
        imageId: activeImage!,
        categoryId: category.id,
      })
    );

    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Clear "{category.name}" annotations?</DialogTitle>

      <DialogContent>
        Annotations categorized as "{category.name}" will be deleted".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onClear} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
