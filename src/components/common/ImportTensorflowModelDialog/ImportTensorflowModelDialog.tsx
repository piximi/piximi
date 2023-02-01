import React, { useEffect, useState } from "react";
import { useDebounce, useHotkeys } from "hooks";
import {
  LayersModel,
  loadLayersModel,
  io,
  loadGraphModel,
  GraphModel,
} from "@tensorflow/tfjs";

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";

import { AlertDialog } from "components/common/AlertDialog/AlertDialog";

import {
  AlertStateType,
  AlertType,
  defaultAlert,
  HotkeyView,
  Shape,
} from "types";
import LanguageIcon from "@mui/icons-material/Language";

type ImportTensorflowModelDialogProps = {
  onClose: () => void;
  open: boolean;
  modelType: "Segmentation" | "Classification";
  dispatchFunction: (
    inputShape: Shape,
    modelName: string,
    classifierModel: any,
    modelArch: string
  ) => void;
};

export const ImportTensorflowModelDialog = ({
  onClose,
  open,
  modelType,
  dispatchFunction,
}: ImportTensorflowModelDialogProps) => {
  // Uploaded Model States
  const [classifierModel, setClassifierModel] = useState<LayersModel>();
  const [segmentationModel, setSegmentationModel] = useState<
    GraphModel | LayersModel
  >();
  const [modelUrl, setModelUrl] = useState<string>(
    "https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1"
  );
  const [modelArch, setModelArch] = useState<string>("graph");
  const [modelName, setModelName] = useState<string>("");
  const [inputShape, setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });

  // Flags
  const [showFileError, setShowFileError] = useState<boolean>(false);
  const [isFromTFHub, setIsFromTFHub] = useState<boolean>(false);
  const [canLoadModel, setCanLoadModel] = useState<boolean>(false);
  const [modelSelected, setModelSelected] = useState<boolean>(false);

  // Error Message
  const [alertState, setAlertState] = useState<AlertStateType>(defaultAlert);

  const dispatchModelToStore = () => {
    dispatchFunction(
      inputShape,
      modelName,
      modelType === "Classification" ? classifierModel : segmentationModel,
      modelArch
    );

    closeDialog();
  };

  const verifySourceMatch = (url: string, isFromTFHub: boolean) => {
    if (url === "") {
      setShowFileError(false);
      return;
    }
    if (isFromTFHub) {
      if (!url.includes("tfhub.dev/tensorflow")) {
        setAlertState({
          alertType: AlertType.Warning,
          name: "Mismatched model source",
          description: "Model url must mach selected source.",
        });
        setShowFileError(true);
        return;
      } else {
        setShowFileError(false);
        return;
      }
    } else {
      setShowFileError(false);
      return;
    }
  };

  const verifySourceMatchDebounced = useDebounce(verifySourceMatch, 1000);

  const loadModelFromSource = async () => {
    if (isFromTFHub) {
      try {
        let model = await loadGraphModel(modelUrl, {
          fromTFHub: true,
        });
        console.log(model);
        setSegmentationModel(model);
        setModelSelected(true);
      } catch (err) {
        const error: Error = err as Error;

        setAlertState({
          alertType: AlertType.Warning,
          name: "Failed to load tensorflow model",
          description:
            "Error fetching the model from resource:\n" +
            error.name +
            "\n" +
            error.message,
        });
        setShowFileError(true);
      }
    }
  };

  const handleSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsFromTFHub(event.target.checked);
    verifySourceMatch(modelUrl, event.target.checked);
  };

  const handleModelUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModelUrl(event.target.value);
    verifySourceMatchDebounced(event.target.value, isFromTFHub);
  };

  const handleModelArchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setModelArch((event.target as HTMLInputElement).value);
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
      const model = await loadLayersModel(
        io.browserFiles([jsonFile, ...weightsFiles])
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

  useHotkeys(
    "enter",
    () => dispatchModelToStore(),
    HotkeyView.ImportTensorflowModelDialog,
    { enableOnTags: ["INPUT"] },
    [dispatchModelToStore]
  );

  useEffect(() => {
    if (!showFileError && modelUrl) {
      setCanLoadModel(true);
    } else {
      setCanLoadModel(false);
    }
  }, [modelUrl, showFileError]);

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
      <DialogContent>
        <Typography>Or upload a model from the internet.</Typography>
      </DialogContent>
      <MenuItem>
        <FormControl fullWidth variant="standard">
          <Input
            id="standard-adornment-amount"
            startAdornment={
              <InputAdornment position="start">
                <LanguageIcon />
              </InputAdornment>
            }
            value={modelUrl}
            onChange={handleModelUrlChange}
          />
        </FormControl>
      </MenuItem>
      <MenuItem>
        <FormControl>
          <FormLabel id="demo-row-radio-buttons-group-label">
            Model Type
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby="demo-row-radio-buttons-group-label"
            name="row-radio-buttons-group"
            value={modelArch}
            onChange={handleModelArchChange}
          >
            <FormControlLabel
              value="graph"
              control={<Radio />}
              label="Graph Model"
            />
            <FormControlLabel
              value="layers"
              control={<Radio />}
              label="Layers Model"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isFromTFHub}
                  onChange={handleSourceChange}
                />
              }
              label="TF Hub"
            />
          </RadioGroup>
        </FormControl>
      </MenuItem>
      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>
        <Button
          onClick={loadModelFromSource}
          color="primary"
          disabled={!canLoadModel}
        >
          Load Model
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
