import React from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "react-hotkeys-hook";
import * as tf from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";

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

import FileOpenIcon from "@mui/icons-material/FileOpen";

import { AlertDialog } from "components/common/dialogs/AlertDialog/AlertDialog";

import { classifierSlice } from "store/slices";

import {
  AlertStateType,
  AlertType,
  defaultAlert,
  ModelType,
  Shape,
} from "types";

type OpenClassifierDialogProps = {
  onClose: any;
  open: any;
  popupState: any;
};

export const OpenClassifierDialog = ({
  onClose,
  open,
  popupState,
}: OpenClassifierDialogProps) => {
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

  const dispatch = useDispatch();

  const dispatchModelToStore = () => {
    dispatch(
      classifierSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName + " - uploaded",
          modelType: ModelType.UserUploaded,
        },
        model: classifierModel as LayersModel,
      })
    );

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

    let weightsFile, jsonFile;
    if (event.currentTarget.files[0].name.includes(".bin")) {
      weightsFile = event.currentTarget.files[0];
      jsonFile = event.currentTarget.files[1];
    } else {
      weightsFile = event.currentTarget.files[1];
      jsonFile = event.currentTarget.files[0];
    }

    var newJsonFile: File;
    try {
      // make sure the weight file required in the json has the correct name
      const jsonFileContent = await jsonFile.text();

      const weightFileName = weightsFile.name;
      const weightFileNameReplaceString =
        'paths":["./' +
        weightFileName.substring(0, weightFileName.length - 4) +
        '.bin"]';

      const regexPattern = new RegExp('paths":\\["./(.)*weights.bin"]');
      const updatedJsonFileContent = jsonFileContent.replace(
        regexPattern,
        weightFileNameReplaceString
      );

      newJsonFile = new File([updatedJsonFileContent], jsonFile.name, {
        type: jsonFile.type,
      });
    } catch (err) {
      const error: Error = err as Error;

      setAlertState({
        alertType: AlertType.Warning,
        name: "Error reading the classifier files",
        description:
          "Couldn't parse classifier files:\n" +
          error.name +
          "\n" +
          error.message,
      });
      setShowFileError(true);
      return;
    }

    try {
      const model = await tf.loadLayersModel(
        tf.io.browserFiles([newJsonFile, weightsFile])
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
      <DialogTitle>Open classifier</DialogTitle>

      <input
        accept="application/json|.bin"
        hidden
        type="file"
        multiple
        id="open-classifier-file"
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
          well as the corresponding model weights (.bin file).
        </Typography>
      </DialogContent>

      <label htmlFor="open-classifier-file">
        <MenuItem component="span" dense>
          <ListItemIcon>
            <FileOpenIcon />
          </ListItemIcon>
          <ListItemText primary="Select classifier files" />
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
          Open Classifier
        </Button>
      </DialogActions>
    </Dialog>
  );
};
