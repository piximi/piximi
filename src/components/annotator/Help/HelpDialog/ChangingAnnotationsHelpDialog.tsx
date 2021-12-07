import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { ChangingAnnotationsHelpContent } from "../HelpContent/HelpContent";

type ChangingAnnotationsHelpDiagogProps = {
  onClose: () => void;
  open: boolean;
};

export const ChangingAnnotationsHelpDialog = ({
  onClose,
  open,
}: ChangingAnnotationsHelpDiagogProps) => {
  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <AppBar position="relative">
        <Toolbar>
          <Typography style={{ flexGrow: 1 }} variant="h6">
            <DialogTitle>{"Changing existing annotations"}</DialogTitle>
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <ChangingAnnotationsHelpContent />
      </DialogContent>
    </Dialog>
  );
};
