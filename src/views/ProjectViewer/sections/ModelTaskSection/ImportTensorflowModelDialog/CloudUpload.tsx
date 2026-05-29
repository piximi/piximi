import type React from "react";
import { useState } from "react";

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

import { RemoteClassifier } from "utils/dl/classification/models";
import { useClassifierApi } from "utils/dl/classification";
import type { ModelInfoDTO, Run } from "utils/dl/classification/types";

export const RemoteClassifierUpload = ({
  isGraph,
  setUploadedModel,
  setErrMessage,
  setSuccessMessage,
}: {
  isGraph: boolean;
  setUploadedModel: React.Dispatch<
    React.SetStateAction<
      | {
          modelDetails: ModelInfoDTO;
          runs: Run[];
        }
      | undefined
    >
  >;
  setErrMessage: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [modelUrl, setModelUrl] = useState("");
  const [isFromTFHub, setIsFromTFHub] = useState(false);
  const cfApi = useClassifierApi();

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
    const result = await cfApi.modelFromUrl(modelUrl, isFromTFHub, isGraph);
    if (result.success) {
      setUploadedModel({ modelDetails: result.data, runs: [] });
      setSuccessMessage(
        `Successfully uploaded Classification ${
          isGraph ? "Graph" : "Layers"
        } Model: "${result.data.name}"`,
      );
    } else {
      console.error(
        `[loadModel] ${result.reason.code}: ${result.reason.message}`,
        result.reason.cause,
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
        />

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
      <Button onClick={() => loadModel()} color="primary">
        Load Model
      </Button>
    </>
  );
};
