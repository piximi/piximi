import { useState } from "react";

import { saveAs } from "file-saver";

import { Grid, TextField } from "@mui/material";

import { useBackend } from "core/backend";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import type { ChangeEvent } from "react";

import type { Classifier } from "core/dl/classification/types";

type SaveFittedModelDialogProps = {
  model: Classifier;
  onClose: () => void;
  open: boolean;
};

/* Downloads the backend's archive of the model: weights, runs and a manifest. */
export const SaveFittedModelDialog = ({
  model,
  onClose,
  open,
}: SaveFittedModelDialogProps) => {
  const backend = useBackend();
  const [name, setName] = useState<string>(model.name);
  const noNameError = name.length === 0;

  const onSaveClassifierClick = async () => {
    try {
      const archive = await backend.classification!.export(model.id);
      const fileName = `${noNameError ? model.name : name}.zip`;
      saveAs(
        new Blob([new Uint8Array(archive.data)], { type: archive.mime }),
        fileName,
      );
    } catch (error) {
      console.error("[SaveFittedModelDialog]", error);
    }
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <ConfirmationDialog
      isOpen={open}
      onClose={onClose}
      title={`Save ${model.name}`}
      content={
        <Grid container spacing={1}>
          <Grid size={{ xs: 10 }}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Model Name"
              value={name}
              margin="dense"
              variant="standard"
              onChange={onNameChange}
              helperText={
                noNameError
                  ? `No name given. Default name ${model.name} will be used.`
                  : ""
              }
              error={noNameError}
            />
          </Grid>
        </Grid>
      }
      onConfirm={onSaveClassifierClick}
      confirmText="Save"
    />
  );
};
