import React, { ChangeEvent, useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { HotkeyView } from "types";

type ExportAnnotationsDialogProps = {
  onClose: () => void;
  open: boolean;
  handleSave: (userProjectName: string) => void;
  defaultName: string;
};

export const ExportAnnotationsDialog = ({
  onClose,
  open,
  handleSave,
  defaultName,
}: ExportAnnotationsDialogProps) => {
  const [projectName, setProjectName] = useState<string>(defaultName);

  const onCancel = () => {
    setProjectName(defaultName);
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  useHotkeys(
    "enter",
    () => {
      handleSave(projectName);
      onClose();
    },
    HotkeyView.ExportAnnotationsDialog,
    { enableOnTags: ["INPUT"] },
    [handleSave]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Export Annotations</DialogTitle>

      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Project file name"
              margin="dense"
              onChange={onNameChange}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>

        <Button onClick={() => handleSave(projectName)} color="primary">
          Export Annotations
        </Button>
      </DialogActions>
    </Dialog>
  );
};
