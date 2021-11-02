import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { OpeningImagesHelpContent } from "../HelpContent/HelpContent";

type OpenImageHelpDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const OpenImageHelpDialog = ({
  onClose,
  open,
}: OpenImageHelpDialogProps) => {
  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <AppBar position="relative">
        <Toolbar>
          <Typography style={{ flexGrow: 1 }} variant="h6">
            <DialogTitle>{"Opening images"}</DialogTitle>
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <OpeningImagesHelpContent />
      </DialogContent>
    </Dialog>
  );
};
