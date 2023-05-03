import React, { useState } from "react";
import {
  LayersModel,
  loadLayersModel,
  io,
  loadGraphModel,
  GraphModel,
} from "@tensorflow/tfjs";

import {
  DialogContent,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";

import FileOpenIcon from "@mui/icons-material/FileOpen";

import { Shape } from "types";

export const LocalFileUpload = ({
  modelType,
  modelArch,
  setSegmentationModel,
  setClassifierModel,
  setInputShape,
  setModelName,
}: {
  modelType: string;
  modelArch: string;
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
}) => {
  const [errMessage, setErrMessage] = useState<string>("");

  const loadModel = async (jsonFile: File, weightsFiles: Array<File>) => {
    let model: GraphModel | LayersModel;

    try {
      if (modelArch === "graph") {
        model = await loadGraphModel(
          io.browserFiles([jsonFile, ...weightsFiles])
        );
      } else {
        model = await loadLayersModel(
          io.browserFiles([jsonFile, ...weightsFiles])
        );
      }

      modelType === "Segmentation"
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
      const jsonFileName = jsonFile.name.replace(/\..+$/, "");
      setModelName(jsonFileName);
    } catch (err) {
      const error: Error = err as Error;

      setErrMessage(error.message);
    }
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    modelType: string,
    modelArch: string
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
    await loadModel(jsonFile, weightsFiles);
  };

  return (
    <>
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
          handleFilesSelected(event, modelType, modelArch)
        }
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
    </>
  );
};
