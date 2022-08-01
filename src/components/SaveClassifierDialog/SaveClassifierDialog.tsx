import { ChangeEvent, useState } from "react";
import { useSelector } from "react-redux";
import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { fittedSelector } from "store/selectors/fittedSelector";
import { selectedModelSelector } from "store/selectors/selectedModelSelector";

type SaveClassifierDialogProps = {
  onClose: () => void;
  open: boolean;
  popupState: any;
};

export const SaveClassifierDialog = ({
  onClose,
  open,
  popupState,
}: SaveClassifierDialogProps) => {
  const fitted = useSelector(fittedSelector);

  const selectedModel = useSelector(selectedModelSelector);

  const [classifierName, setClassifierName] = useState<string>(
    selectedModel.modelName
  );

  const noFittedModel = fitted ? false : true;

  const onSaveClassifierClick = async () => {
    await fitted.save(`downloads://${classifierName}`);

    onClose();
    popupState.close();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setClassifierName(event.target.value);
  };

  useHotkeys(
    "enter",
    () => {
      onSaveClassifierClick();
    },
    { enabled: open },
    [onSaveClassifierClick]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Save Classifier</DialogTitle>

      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Classifier name"
              margin="dense"
              onChange={onNameChange}
              helperText={
                noFittedModel
                  ? "There is no trained model that could be saved."
                  : ""
              }
              error={noFittedModel}
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
          disabled={noFittedModel}
        >
          Save Classifier
        </Button>
      </DialogActions>
    </Dialog>
  );
};
