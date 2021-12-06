import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

type ExitAnnotatorDialogProps = {
  onConfirm: () => void;
  onClose: () => void;
  open: boolean;
};

export const ExitAnnotatorDialog = ({
  onConfirm,
  onClose,
  open,
}: ExitAnnotatorDialogProps) => {
  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Save annotations?</DialogTitle>

      <DialogContent>
        Would you like to save these annotations and return to the project page?
        These annotations will be used for training.
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Stay on this page
        </Button>

        <Button onClick={onConfirm} color="primary">
          Save annotations and return to project
        </Button>
      </DialogActions>
    </Dialog>
  );
};
