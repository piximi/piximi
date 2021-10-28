import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { applicationSlice } from "../../../../annotator/store";
import { selectedCategorySelector } from "../../../../annotator/store/selectors";

type ClearCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ClearCategoryDialog = ({
  onClose,
  open,
}: ClearCategoryDialogProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const onClear = () => {
    dispatch(
      applicationSlice.actions.clearCategoryAnnotations({ category: category })
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
