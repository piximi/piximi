import React, { useState } from "react";

import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";

import FileOpenIcon from "@mui/icons-material/FileOpen";

import { Model } from "utils/models/Model/Model";
import { UploadedClassifier } from "utils/models/UploadedClassifier/UploadedClassifier";
import { ModelTask } from "utils/models/enums";
import { Shape } from "store/data/types";

//TODO: MenuItem??

export const LocalFileUpload = ({
  modelTask,
  isGraph,
  setModel,
  setInputShape,
}: {
  modelTask: ModelTask;
  isGraph: boolean;
  setModel: (model: Model) => void;
  setInputShape: React.Dispatch<React.SetStateAction<Shape>>;
}) => {
  const [errMessage, setErrMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadModel = async (descFile: File, weightsFiles: Array<File>) => {
    setErrMessage("");
    setSuccessMessage("");

    // remove the file extension from the model name
    const modelName = descFile.name.replace(/\..+$/, "");

    if (modelTask === ModelTask.Classification) {
      const model = new UploadedClassifier({
        TFHub: false,
        descFile,
        weightsFiles,
        name: modelName,
        task: modelTask,
        graph: isGraph,
        pretrained: true,
        trainable: isGraph,
      });

      try {
        await model.upload();
      } catch (err) {
        setErrMessage(`Model upload failed: ${err}`);
        return;
      }

      const inputShape = model.defaultInputShape;

      setInputShape((prevShape) => ({
        ...prevShape,
        height: inputShape[0],
        width: inputShape[1],
        channels: inputShape[2],
      }));

      setModel(model);

      setSuccessMessage(
        `Successfully uploaded Classification ${
          isGraph ? "Graph" : "Layers"
        } Model ("${model.name}")`
      );
    } else {
      // TODO - segmenter
      setErrMessage("Uploaded segmenter not yet supported");
    }
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.persist();

    if (!event.currentTarget.files) {
      setErrMessage("No files selected");
      return;
    } else if (event.currentTarget.files.length < 2) {
      setErrMessage(
        "Must include model description (.json) and at least one weights file (.bin)"
      );
      return;
    } else {
      setErrMessage("");
    }

    let weightsFiles: Array<File> = [];
    let jsonFile = event.currentTarget.files[0];
    for (let i = 0; i < event.currentTarget.files.length; i++) {
      const file = event.currentTarget.files[i];
      if (file.name.endsWith(".json")) {
        jsonFile = file;
        // jsonFile.type === "application/json"
      } else {
        weightsFiles.push(file);
        // file.type === "application/macbinary"
      }
    }

    await loadModel(jsonFile, weightsFiles);
  };

  return (
    <>
      <Typography>Upload model files from your computer.</Typography>
      <Typography gutterBottom fontSize={"small"}>
        Tensorflow requires a .json files containing the model description as
        well as the corresponding model weights (.bin file(s)).
      </Typography>

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
          handleFilesSelected(event)
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
      <Typography
        style={{
          whiteSpace: "pre-line",
          fontSize: "0.75rem",
          color: "green",
        }}
      >
        {successMessage}
      </Typography>
    </>
  );
};
