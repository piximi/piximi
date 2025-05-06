import { ChangeEvent, useState } from "react";
import { Grid2 as Grid, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { Model } from "utils/models/Model";

import JSZip from "jszip";
import saveAs from "file-saver";

type SaveFittedModelDialogProps = {
  model: Model;
  onClose: () => void;
  open: boolean;
};

export const SaveFittedModelDialog = ({
  model,
  onClose,
  open,
}: SaveFittedModelDialogProps) => {
  const [name, setName] = useState<string>(model.name);
  const noNameError = name.length === 0;
  const onSaveClassifierClick = async () => {
    const modelBlobs = await model.getSavedModelFiles();
    const zip = new JSZip();
    zip.file(modelBlobs.modelJsonFileName, modelBlobs.modelJsonBlob);
    zip.file(modelBlobs.weightsFileName, modelBlobs.weightsBlob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${noNameError ? model.name : name}.zip`);

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
