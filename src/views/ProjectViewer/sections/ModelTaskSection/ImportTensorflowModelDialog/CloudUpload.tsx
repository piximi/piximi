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

import { UploadedClassifier } from "utils/models/classification";
import { Model } from "utils/models/Model";

import { ModelTask } from "utils/models/enums";

import { Shape } from "store/data/types";

export const CloudUpload = ({
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
  const [errMessage, setErrMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [isFromTFHub, setIsFromTFHub] = useState(false);

  const verifySourceMatch = (url: string, isFromTFHub: boolean) => {
    if (isFromTFHub && !UploadedClassifier.verifyTFHubUrl(url)) {
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

    if (modelTask === ModelTask.Classification) {
      const model = new UploadedClassifier({
        name: "User Uploaded Classifier",
        task: modelTask,
        pretrained: true,
        trainable: isGraph,
        TFHub: isFromTFHub,
        graph: isGraph,
        src: modelUrl,
      });

      try {
        await model.upload();
      } catch (err) {
        setErrMessage(`Failed to download model: ${err}`);
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
        } Model ("${model.name}")`,
      );
    } else {
      // TODO - segmenter
      setErrMessage("Segmenter loading by url not yet supported");
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
