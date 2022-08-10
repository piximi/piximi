import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";
import { Shape } from "types/Shape";
import * as tf from "@tensorflow/tfjs";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import { LayersModel } from "@tensorflow/tfjs";
import { useHotkeys } from "react-hotkeys-hook";
import { AlertStateType, AlertType, defaultAlert } from "types/AlertStateType";
import { AlertDialog } from "components/common/AlertDialog/AlertDialog";

type ImportTensorflowModelDialogProps = {
  onClose: any;
  open: any;
  popupState: any;
  modelType: string;
  dispatchFunction: (
    inputShape: Shape,
    modelName: string,
    classifierModel: any
  ) => void;
};

export const ImportTensorflowModelDialog = ({
  onClose,
  open,
  popupState,
  modelType,
  dispatchFunction,
}: ImportTensorflowModelDialogProps) => {
  const [classifierModel, setClassifierModel] = React.useState<LayersModel>();
  const [modelSelected, setModelSelected] = React.useState<boolean>(false);
  const [modelName, setModelName] = React.useState<string>("");
  const [inputShape, setInputShape] = React.useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
    frames: 1,
  });

  const [alertState, setAlertState] =
    React.useState<AlertStateType>(defaultAlert);
  const [showFileError, setShowFileError] = React.useState<boolean>(false);

  const dispatchModelToStore = () => {
    dispatchFunction(inputShape, modelName, classifierModel);

    closeDialog();
    popupState.close();
  };

  const closeDialog = () => {
    setShowFileError(false);
    onClose();
  };

  const onClassifierFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.persist();

    if (!event.currentTarget.files) {
      return;
    }

    let weightsFiles: Array<File> = [];
    let jsonFile = event.currentTarget.files[0];
    for (let i = 0; i < event.currentTarget.files.length; i++) {
      const file = event.currentTarget.files[i];
      if (file.name.endsWith(".json")) {
        jsonFile = file;
      } else {
        weightsFiles.push(file);
      }
    }

    try {
      const model = await tf.loadLayersModel(
        tf.io.browserFiles([jsonFile, ...weightsFiles])
      );
      setClassifierModel(model);
      setModelSelected(true);

      const modelShape = model.inputs[0].shape.slice(1) as number[];
      setInputShape((prevShape) => ({
        ...prevShape,
        height: modelShape[0],
        width: modelShape[1],
        channels: modelShape[2],
      }));

      // remove the file extension from the model name
      const jsonFileName = jsonFile.name.replace(/\..+$/, "");
      setModelName(jsonFileName);
    } catch (err) {
      const error: Error = err as Error;

      setAlertState({
        alertType: AlertType.Warning,
        name: "Failed to load tensorflow model",
        description:
          "Invalid files selected:\n" + error.name + "\n" + error.message,
      });
      setShowFileError(true);
    }
  };

  useHotkeys("enter", () => dispatchModelToStore(), { enabled: open }, [
    dispatchModelToStore,
  ]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <DialogTitle>Import {modelType} model</DialogTitle>

      <input
        accept="application/json|.bin"
        hidden
        type="file"
        multiple
        id="open-model-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onClassifierFilesSelected(event)
        }
      />

      {showFileError && (
        <AlertDialog
          setShowAlertDialog={() => setShowFileError(false)}
          alertState={alertState}
        />
      )}

      <DialogContent>
        <Typography gutterBottom>
          Tensorflow requires a .json files containing the model description as
          well as the corresponding model weights (.bin file(s)).
        </Typography>
      </DialogContent>

      <label htmlFor="open-model-file">
        <MenuItem component="span" dense>
          <ListItemIcon>
            <FileOpenIcon />
          </ListItemIcon>
          <ListItemText primary="Select model files" />
        </MenuItem>
      </label>

      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={!modelSelected}
        >
          Open {modelType} model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
