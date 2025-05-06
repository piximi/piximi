import React, { useState } from "react";

import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";

import { FileOpen as FileOpenIcon } from "@mui/icons-material";

import { SequentialClassifier } from "utils/models/classification";

import JSZip from "jszip";
import classifierHandler from "utils/models/classification/classifierHandler";
import { isObjectEmpty } from "utils/objectUtils";

//TODO: MenuItem??

export const LocalClassifierUpload = ({
  isGraph,
  setUploadedModels,
}: {
  isGraph: boolean;
  setUploadedModels: React.Dispatch<
    React.SetStateAction<SequentialClassifier[]>
  >;
}) => {
  const [errMessage, setErrMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadZip = async (zip: JSZip) => {
    const result = await classifierHandler.addFromZip(zip);
    if (!isObjectEmpty(result.failedModels)) {
      setErrMessage(
        `Failed to upload models: ${Object.keys(result.failedModels!).join(", ")}`,
      );
    }
    if (result.loadedModels.length > 0) {
      setUploadedModels(result.loadedModels);
      setSuccessMessage(
        `Successfully uploaded Classification ${
          isGraph ? "Graph" : "Layers"
        } Models: "${result.loadedModels.map((model) => model.name).join(", ")}"`,
      );
    }
  };

  const loadModel = async (descFile: File, weightsFiles: Array<File>) => {
    setErrMessage("");
    setSuccessMessage("");

    const result = await classifierHandler.addFromFiles(
      descFile,
      weightsFiles,
      isGraph,
    );
    if (!isObjectEmpty(result.failedModels)) {
      setErrMessage(
        `Failed to upload models: ${Object.keys(result.failedModels!).join(", ")}`,
      );
    }
    if (result.loadedModels.length > 0) {
      setUploadedModels(result.loadedModels);
      setSuccessMessage(
        `Successfully uploaded Classification ${
          isGraph ? "Graph" : "Layers"
        } Models: "${result.loadedModels.map((model) => model.name).join(", ")}"`,
      );
    }
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    const files = event.currentTarget.files;
    if (!files) {
      return;
    } else if (files.length === 1 && files[0].type === "application/zip") {
      const file = files[0];
      const zipFile = await new JSZip().loadAsync(file);
      await loadZip(zipFile);
    } else if (files.length >= 2) {
      const weightsFiles: Array<File> = [];
      let jsonFile = files[0];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith(".json")) {
          jsonFile = file;
        } else {
          weightsFiles.push(file);
        }
      }

      await loadModel(jsonFile, weightsFiles);
      setErrMessage("");
    } else {
      setErrMessage(
        "Must include model description (.json) and at least one weights file (.bin)",
      );
      return;
    }
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
