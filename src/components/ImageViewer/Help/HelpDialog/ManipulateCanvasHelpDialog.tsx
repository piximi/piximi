import React from "react";
import { ManipulatingCanvasContent } from "../HelpContent/HelpContent";
import {
  AppBar,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type ManipulateCanvasHelpDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ManipulateCanvasHelpDialog = ({
  onClose,
  open,
}: ManipulateCanvasHelpDialogProps) => {
  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <AppBar position="relative">
        <Toolbar>
          <Typography style={{ flexGrow: 1 }} variant="h6">
            <DialogTitle>{"Manipulating the canvas"}</DialogTitle>
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <ManipulatingCanvasContent />
      </DialogContent>
    </Dialog>
  );
};
