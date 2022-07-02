import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useDispatch } from "react-redux";
import { imageViewerSlice, projectSlice } from "store/slices";
import { Category } from "types/Category";

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

  const onClear = () => {
    dispatch(
      imageViewerSlice.actions.clearCategoryAnnotations({ category: category })
    );

    dispatch(projectSlice.actions.clearAnnotations({ category: category }));

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
