import { ChangeEvent, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import { useHotkeys } from "react-hotkeys-hook";
import { SegmenterModelProps, ClassifierModelProps } from "types/ModelType";
import { LayersModel } from "@tensorflow/tfjs";

type SaveFittedModelDialogProps = {
  modelProps: ClassifierModelProps | SegmenterModelProps;
  fittedModel: LayersModel | undefined;
  modelTypeString: string;
  onClose: () => void;
  open: boolean;
  popupState: any;
};

export const SaveFittedModelDialog = ({
  modelProps,
  fittedModel,
  modelTypeString,
  onClose,
  open,
  popupState,
}: SaveFittedModelDialogProps) => {
  const [classifierName, setClassifierName] = useState<string>(
    modelProps.modelName
  );

  const noFittedModel = fittedModel ? false : true;

  const onSaveClassifierClick = async () => {
    await fittedModel!.save(`downloads://${classifierName}`);

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
      <DialogTitle>Save {modelTypeString}</DialogTitle>

      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label={modelTypeString + " name"}
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
          Save {modelTypeString}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
