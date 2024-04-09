import React, { ChangeEvent, useState } from "react";

import { Grid, TextField } from "@mui/material";

import { useHotkeys } from "hooks";

import { HotkeyView } from "utils/common/enums";
import { DialogWithAction } from "../DialogWithAction";

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
    <DialogWithAction
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
              defaultValue={projectName}
              onChange={onNameChange}
            />
          </Grid>
        </Grid>
      }
      onClose={onCancel}
      onConfirm={() => handleSave(projectName)}
      confirmText="Export Annotations"
      isOpen={open}
    />
  );
};
