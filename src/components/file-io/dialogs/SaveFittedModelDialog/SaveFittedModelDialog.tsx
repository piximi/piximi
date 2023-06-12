import { ChangeEvent, useState } from "react";
import { useHotkeys } from "hooks";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { HotkeyView } from "types";
import { ModelStatus } from "types/ModelType";
import { Model } from "utils/common/models/Model";

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
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Save {model.name}</DialogTitle>

      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label={model.name}
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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button
          onClick={onSaveClassifierClick}
          color="primary"
          disabled={modelStatus !== ModelStatus.Trained}
        >
          Save {name}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
