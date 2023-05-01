import React, { useState } from "react";
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
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

import { useDebounce } from "hooks";
import { Shape } from "types";

export const CloudUpload = ({
  modelKind,
  isGraph,
  setSegmentationModel,
  setClassifierModel,
  setInputShape,
  setModelName,
  setIsGraph,
}: {
  modelKind: string;
  isGraph: boolean;
  setSegmentationModel: React.Dispatch<
    React.SetStateAction<
      LayersModel | GraphModel<string | io.IOHandler> | undefined
    >
  >;
  setClassifierModel: React.Dispatch<
    React.SetStateAction<
      LayersModel | GraphModel<string | io.IOHandler> | undefined
    >
  >;
  setInputShape: React.Dispatch<React.SetStateAction<Shape>>;
  setModelName: React.Dispatch<React.SetStateAction<string>>;
  setIsGraph: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isFromTFHub, setIsFromTFHub] = useState<boolean>(false);
  const [errMessage, setErrMessage] = useState<string>("");
  const [modelUrl, setModelUrl] = useState<string>("");
  const verifySourceMatch = (url: string, isFromTFHub: boolean) => {
    if (isFromTFHub) {
      if (url === "") {
        setErrMessage("URL must point to TFHub");
        return;
      }
      if (!url.includes("tfhub.dev/tensorflow")) {
        setErrMessage("URL must point to TFHub");
        return;
      } else {
        setErrMessage("");
        return;
      }
    } else {
      setErrMessage("");
      return;
    }
  };

  const verifySourceMatchDebounced = useDebounce(verifySourceMatch, 1000);

  const handleSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsFromTFHub(event.target.checked);
    verifySourceMatch(modelUrl, event.target.checked);
  };

  const handleModelUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModelUrl(event.target.value);
    verifySourceMatchDebounced(event.target.value, isFromTFHub);
  };

  const handleModelTypeChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setIsGraph(event.target.value === "Graph");

  const loadModel = async () => {
    let model: GraphModel | LayersModel;

    try {
      if (isGraph) {
        model = await loadGraphModel(modelUrl, {
          fromTFHub: isFromTFHub,
        });
      } else {
        model = await loadLayersModel(modelUrl, {
          fromTFHub: isFromTFHub,
        });
      }

      modelKind === "Segmentation"
        ? setSegmentationModel(model)
        : setClassifierModel(model as LayersModel);
      const modelShape = model.inputs[0].shape!.slice(1) as number[];
      setInputShape((prevShape) => ({
        ...prevShape,
        height: modelShape[0],
        width: modelShape[1],
        channels: modelShape[2],
      }));

      // remove the file extension from the model name
      setModelName("UserUploaded");
    } catch (err) {
      const error: Error = err as Error;

      setErrMessage(error.message);
    }
  };

  return (
    <>
      <DialogContent>
        <Typography>{"Or upload a model from the internet."}</Typography>
      </DialogContent>
      <MenuItem>
        <FormControl sx={{ width: "75%", ml: 2, pr: 1 }}>
          <TextField
            variant={"standard"}
            id="web-upload-input-label"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LanguageIcon />
                </InputAdornment>
              ),
            }}
            size={"small"}
            value={modelUrl}
            onChange={handleModelUrlChange}
            error={errMessage.length > 0}
          />
          <Typography
            style={{
              whiteSpace: "pre-line",
              fontSize: "0.75rem",
              color: "red",
            }}
          >
            {errMessage}
          </Typography>
        </FormControl>
        <Button
          onClick={async () => loadModel()}
          color="primary"
          disabled={errMessage.length !== 0 || modelUrl.length === 0}
        >
          Load Model
        </Button>
      </MenuItem>
      <MenuItem>
        <FormControl>
          <FormLabel id="model-type-radio-buttons-group-label">
            Model Type
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby="model-type-radio-buttons-group-label"
            name="model-type-radio-buttons-group"
            value={isGraph ? "Graph" : "Layers"}
            onChange={handleModelTypeChange}
          >
            <FormControlLabel
              value="Graph"
              control={<Radio />}
              label="Graph Model"
            />
            <FormControlLabel
              value="Layers"
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
    </>
  );
};
