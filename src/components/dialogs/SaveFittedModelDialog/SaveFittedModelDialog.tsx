import { ChangeEvent, useState } from "react";
import { useHotkeys } from "hooks";

import { Grid, TextField } from "@mui/material";

import { HotkeyView } from "utils/common/enums";
import { Model } from "utils/models/Model/Model";
import { DialogWithAction } from "../DialogWithAction";
import { ModelStatus } from "utils/models/enums";

type SaveFittedModelDialogProps = {
  model: Model;
  modelStatus: ModelStatus;
  onClose: () => void;
  open: boolean;
};

export const SaveFittedModelDialog = ({
  model,
  modelStatus,
  onClose,
  open,
}: SaveFittedModelDialogProps) => {
  const [name, setName] = useState<string>(model.name);

  const onSaveClassifierClick = async () => {
    await model.saveModel();

    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  useHotkeys(
    "enter",
    () => {
      onSaveClassifierClick();
    },
    HotkeyView.SaveFittedModelDialog,
    { enableOnTags: ["INPUT"] },
    [onSaveClassifierClick]
  );

  return (
    <DialogWithAction
      isOpen={open}
      onClose={onClose}
      title={`Save ${model.name}`}
      content={
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Model Name"
              value={name}
              defaultValue={model.name}
              margin="dense"
              onChange={onNameChange}
              helperText={
                modelStatus !== ModelStatus.Trained
                  ? "There is no trained model that could be saved."
                  : ""
              }
              error={modelStatus !== ModelStatus.Trained}
            />
          </Grid>
        </Grid>
      }
      onConfirm={onSaveClassifierClick}
      confirmText="Save"
      confirmDisabled={modelStatus !== ModelStatus.Trained}
    />
  );
};
