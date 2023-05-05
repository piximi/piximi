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

<<<<<<< HEAD:src/components/file-io/dialogs/SaveFittedModelDialog/SaveFittedModelDialog.tsx
import { HotkeyView } from "types";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { ModelStatus } from "types/ModelType";
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx
import { SegmenterModelProps, ClassifierModelProps, HotkeyView } from "types";
=======
import { HotkeyView } from "types";
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx

// TODO - segmenter: All of this
type SaveFittedModelDialogProps = {
<<<<<<< HEAD:src/components/file-io/dialogs/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  // TODO - segmenter: change to Model
  model: SequentialClassifier | Segmenter;
  modelStatus: ModelStatus;
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  modelProps: ClassifierModelProps | SegmenterModelProps;
  fittedModel: LayersModel | undefined;
  modelKind: string;
=======
  modelName: string;
  fittedModel: LayersModel | undefined;
  modelKind: string;
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  onClose: () => void;
  open: boolean;
};

export const SaveFittedModelDialog = ({
<<<<<<< HEAD:src/components/file-io/dialogs/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  model,
  modelStatus,
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  modelProps,
  fittedModel,
  modelKind,
=======
  modelName,
  fittedModel,
  modelKind,
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  onClose,
  open,
}: SaveFittedModelDialogProps) => {
<<<<<<< HEAD:src/components/file-io/dialogs/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  const [name, setName] = useState<string>(model.name);
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx
  const [classifierName, setClassifierName] = useState<string>(
    modelProps.modelName
  );

  const noFittedModel = fittedModel ? false : true;
=======
  const [classifierName, setClassifierName] = useState<string>(modelName);

  const noFittedModel = fittedModel ? false : true;
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running):src/components/file-io/SaveFittedModelDialog/SaveFittedModelDialog.tsx

  const onSaveClassifierClick = async () => {
    // TODO - segmenter
    await model._model!.save(`downloads://${name}`);

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
