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
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
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
import Stardist2DBrightfieldModel from "data/model-data/stardist/model.json";
//@ts-ignore
import Stardist2DBrightfieldWeights1 from "data/model-data/stardist/group1-shard1of2.bin";
//@ts-ignore
import Stardist2DBrightfieldWeights2 from "data/model-data//stardist/group1-shard2of2.bin";

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
  const [modelUrl, setModelUrl] = useState<string>("");
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
  const [filesSelected, setFilesSelected] = useState<boolean>(false);
  const [selectedPreTrainedModel, setSelectedPreTrainedModel] =
    useState<string>("none");

  // Error Message
  const [alertState, setAlertState] = useState<AlertStateType>(defaultAlert);

  const dispatchModelToStore = () => {
    dispatchFunction(
      inputShape,
      selectedPreTrainedModel ? selectedPreTrainedModel : modelName,
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
    setFilesSelected(true);

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

  const handlePreTrainedModelChange = async (event: SelectChangeEvent) => {
    setSelectedPreTrainedModel(event.target.value as string);
    if ((event.target.value as string) === "Stardist Versitile H&E") {
      const model_topology_blob = new Blob(
        [JSON.stringify(Stardist2DBrightfieldModel)],
        {
          type: "application/json",
        }
      );
      const model_topology = new File([model_topology_blob], "model.json", {
        type: "application/json",
      });

      const model_weights_fetch1 = await fetch(Stardist2DBrightfieldWeights1);
      const model_weights_blob1 = await model_weights_fetch1.blob();
      const model_weights1 = new File(
        [model_weights_blob1],
        "group1-shard1of2.bin",
        {
          type: "application/octet-stream",
        }
      );

      const model_weights_fetch2 = await fetch(Stardist2DBrightfieldWeights2);
      const model_weights_blob2 = await model_weights_fetch2.blob();
      const model_weights2 = new File(
        [model_weights_blob2],
        "group1-shard2of2.bin",
        {
          type: "application/octet-stream",
        }
      );
      try {
        const model = await loadGraphModel(
          io.browserFiles([model_topology, model_weights1, model_weights2])
        );
        setSegmentationModel(model);
        setModelSelected(true);

        const modelShape = model.inputs[0].shape!.slice(1) as number[];
        setInputShape((prevShape) => ({
          ...prevShape,
          height: modelShape[0],
          width: modelShape[1],
          channels: modelShape[2],
        }));

        // remove the file extension from the model name
        const jsonFileName = model_topology.name.replace(/\..+$/, "");
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
    }
  };

  const onSegmenterFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.persist();

    if (!event.currentTarget.files) {
      return;
    }
    setFilesSelected(true);
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
      const model = await loadGraphModel(
        io.browserFiles([jsonFile, ...weightsFiles])
      );
      console.log(model);
      setSegmentationModel(model);
      setModelSelected(true);

      const modelShape = model.inputs[0].shape!.slice(1) as number[];
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

      {showFileError && (
        <AlertDialog
          setShowAlertDialog={() => setShowFileError(false)}
          alertState={alertState}
        />
      )}

      <DialogContent>
        <Typography>Upload model files from your computer.</Typography>
        <Typography gutterBottom fontSize={"small"} sx={{ ml: 1 }}>
          Tensorflow requires a .json files containing the model description as
          well as the corresponding model weights (.bin file(s)).
        </Typography>
      </DialogContent>

      <label htmlFor="open-model-file">
        <MenuItem component="span" dense sx={{ ml: 2 }}>
          <ListItemIcon>
            <FileOpenIcon />
          </ListItemIcon>
          <ListItemText primary="Select model files" />
        </MenuItem>
      </label>
      <input
        accept="application/json|.bin"
        hidden
        type="file"
        multiple
        id="open-model-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          modelType === "Classification"
            ? onClassifierFilesSelected(event)
            : onSegmenterFilesSelected(event)
        }
        disabled={modelUrl !== "" || selectedPreTrainedModel !== "none"}
      />
      <DialogContent>
        <Typography gutterBottom>
          Choose from a provided pre-trained model
        </Typography>
      </DialogContent>
      <MenuItem>
        <FormControl sx={{ width: "75%", ml: 2 }} size="small">
          <InputLabel id="demo-simple-select-label">
            Pre-trained Models
          </InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={selectedPreTrainedModel}
            label="Pre-trained Models"
            onChange={handlePreTrainedModelChange}
            disabled={filesSelected || modelUrl !== ""}
          >
            <MenuItem value={"none"}>None</MenuItem>
            <MenuItem value={"Stardist Versitile H&E"}>
              Stardist Versitile H&E
            </MenuItem>
          </Select>
        </FormControl>
      </MenuItem>
      <DialogContent>
        <Typography>Or upload a model from the internet.</Typography>
      </DialogContent>
      <MenuItem>
        <FormControl sx={{ width: "75%", ml: 2 }} variant="standard">
          <Input
            id="standard-adornment-amount"
            startAdornment={
              <InputAdornment position="start">
                <LanguageIcon />
              </InputAdornment>
            }
            value={modelUrl}
            onChange={handleModelUrlChange}
            disabled={filesSelected || selectedPreTrainedModel !== "none"}
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
