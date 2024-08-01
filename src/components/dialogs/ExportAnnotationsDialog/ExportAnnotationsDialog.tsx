import React, { ChangeEvent, useState } from "react";

import { Grid, TextField } from "@mui/material";
import { ConfirmationDialog } from "../ConfirmationDialog";

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

  const handleCancel = () => {
    setProjectName(defaultName);
    onClose();
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  return (
    <ConfirmationDialog
      title="Export Annotations"
      content={
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Project file name"
              margin="dense"
              variant="standard"
              defaultValue={projectName}
              onChange={handleNameChange}
            />
          </Grid>
        </Grid>
      }
      onClose={handleCancel}
      onConfirm={() => handleSave(projectName)}
      confirmText="Export Annotations"
      isOpen={open}
    />
  );
};
