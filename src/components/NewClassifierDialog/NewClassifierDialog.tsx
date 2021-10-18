import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React from "react";

type NewClassifierDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const NewClassifierDialog = ({
  onClose,
  open,
}: NewClassifierDialogProps) => {
  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>New classifier</DialogTitle>

      <DialogContent>
        <TextField autoFocus fullWidth id="name" label="Name" margin="dense" />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onClose} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
