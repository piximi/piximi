import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { SavingProjectHelpContent } from "../HelpContent/HelpContent";

type SavingProjectHelpDiagogProps = {
  onClose: () => void;
  open: boolean;
};

export const SavingProjectHelpDialog = ({
  onClose,
  open,
}: SavingProjectHelpDiagogProps) => {
  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <AppBar position="relative">
        <Toolbar>
          <Typography style={{ flexGrow: 1 }} variant="h6">
            <DialogTitle>
              {"Saving project and exporting annotations"}
            </DialogTitle>
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <SavingProjectHelpContent />
      </DialogContent>
    </Dialog>
  );
};
