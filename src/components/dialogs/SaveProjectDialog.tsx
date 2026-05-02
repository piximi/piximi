// TODO: implement segmenter serialization
import { ChangeEvent, useState } from "react";
import { Grid, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

type SaveProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SaveProjectDialog = ({
  onClose,
  open,
}: SaveProjectDialogProps) => {
  const [projectName, setProjectName] = useState<string>("");

  const onSaveProjectClick = async () => {
    onClose();
  };

  const onCancel = () => {
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  return (
    <ConfirmationDialog
      isOpen={open}
      onClose={onCancel}
      title="Save Project"
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
              value={projectName}
              onChange={onNameChange}
            />
          </Grid>
        </Grid>
      }
      onConfirm={onSaveProjectClick}
      confirmText="Save Project"
    />
  );
};
