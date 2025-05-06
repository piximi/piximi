import React, { useState } from "react";

import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Language as LanguageIcon } from "@mui/icons-material";

import { useDebounce } from "hooks";

import { RemoteClassifier } from "utils/models/classification/UploadedClassifier";

import classifierHandler from "utils/models/classification/classifierHandler";
import { isObjectEmpty } from "utils/objectUtils";
import { SequentialClassifier } from "utils/models/classification";

export const RemoteClassifierUpload = ({
  isGraph,
  setUploadedModels,
}: {
  isGraph: boolean;
  setUploadedModels: React.Dispatch<
    React.SetStateAction<SequentialClassifier[]>
  >;
}) => {
  const [errMessage, setErrMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [isFromTFHub, setIsFromTFHub] = useState(false);

  const verifySourceMatch = (url: string, isFromTFHub: boolean) => {
    if (isFromTFHub && !RemoteClassifier.verifyTFHubUrl(url)) {
      setErrMessage("URL must point to TFHub");
      return;
    }

    setErrMessage("");
    return;
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

  const loadModel = async () => {
    setErrMessage("");
    setSuccessMessage("");

    const result = await classifierHandler.addFromUrl(
      modelUrl,
      isFromTFHub,
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

  return (
    <>
      <Typography gutterBottom>
        {"Upload a model from the internet."}
      </Typography>

      <FormControl sx={{ ml: 2, pr: 1 }}>
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
        <Typography
          style={{
            whiteSpace: "pre-line",
            fontSize: "0.75rem",
            color: "green",
          }}
        >
          {successMessage}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={isFromTFHub}
              onChange={handleSourceChange}
            />
          }
          label="From TF Hub?"
        />
      </FormControl>
      <Button
        onClick={async () => loadModel()}
        color="primary"
        disabled={errMessage.length !== 0 || modelUrl.length === 0}
      >
        Load Model
      </Button>
    </>
  );
};
