import type React from "react";
import { useState } from "react";

import JSZip from "jszip";

import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";
import { FileOpen as FileOpenIcon } from "@mui/icons-material";

import { isObjectEmpty } from "utils/objectUtils";
import type { ModelInfoDTO } from "utils/dl/classification/types";
import { ClassifierApi } from "utils/dl/classification";

//TODO: MenuItem??

export const LocalClassifierUpload = ({
  isGraph,
  setUploadedModels,
}: {
  isGraph: boolean;
  setUploadedModels: React.Dispatch<React.SetStateAction<ModelInfoDTO[]>>;
}) => {
  const [errMessage, setErrMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    const files = event.currentTarget.files;
    if (!files) {
      return;
    }
    const cfApi = ClassifierApi.getInstance();
    let results: {
      loadedModels: ModelInfoDTO[];
      failedModels: Record<string, { reason: string; err?: Error }>;
    } = {
      loadedModels: [],
      failedModels: {},
    };

    if (files.length === 1 && files[0].type === "application/zip") {
      const file = files[0];
      const zipFile = await new JSZip().loadAsync(file);
      const result = await cfApi.modelsFromZipBuffer(zipFile);
      if (result.success) {
        results = result.data;
      } else {
        console.error(
          `[upload model zip: ${file.name}] ${result.reason.code}: ${result.reason.message}`,
          result.reason.cause,
        );
      }
    } else {
      const weightsFiles: Array<File> = [];
      let descFile: File | undefined;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith(".json")) {
          descFile = file;
        } else {
          weightsFiles.push(file);
        }
      }

      if (!descFile || weightsFiles.length === 0) {
        setErrMessage(
          "Must include model description (.json) and at least one weights file (.bin)",
        );
        return;
      }

      const result = await cfApi.modelFromFiles({
        descFile,
        weightsFiles,
        isGraph,
      });
      if (result.success) {
        results.loadedModels = [result.data];
      } else {
        console.error(
          `[upload model zip: ${descFile.name}] ${result.reason.code}: ${result.reason.message}`,
          result.reason.cause,
        );
        results = {
          loadedModels: [],
          failedModels: {
            [descFile.name]: { reason: result.reason.message },
          },
        };
      }

      setErrMessage("");
    }
    if (!isObjectEmpty(results.failedModels)) {
      setErrMessage(
        `Failed to upload models: ${Object.keys(results.failedModels!).join(", ")}`,
      );
    }
    if (results.loadedModels.length > 0) {
      setUploadedModels(results.loadedModels);
      setSuccessMessage(
        `Successfully uploaded Classification ${
          isGraph ? "Graph" : "Layers"
        } Models: "${results.loadedModels.map((model) => model.name).join(", ")}"`,
      );
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
