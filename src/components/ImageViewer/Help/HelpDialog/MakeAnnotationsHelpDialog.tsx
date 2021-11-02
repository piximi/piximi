import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { MakingNewAnnotationsHelpContent } from "../HelpContent/HelpContent";

type MakeAnnotationsHelpDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const MakeAnnotationsHelpDialog = ({
  onClose,
  open,
}: MakeAnnotationsHelpDialogProps) => {
  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <AppBar position="relative">
        <Toolbar>
          <Typography variant={"h6"}>
            Creating new categories and editting categories
          </Typography>
          <Typography style={{ flexGrow: 1 }} variant="h6">
            <DialogTitle>{"Making new annotations"}</DialogTitle>
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <MakingNewAnnotationsHelpContent />
      </DialogContent>
    </Dialog>
  );
};
