import type React from "react";
import { useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Language as LanguageIcon } from "@mui/icons-material";

import { useDebounce } from "hooks";

import { RemoteClassifier } from "utils/dl/classification/models";

export const RemoteClassifierUpload = ({
  onUploadModel,
}: {
  onUploadModel: (modelUrl: string, isFromTFHub: boolean) => Promise<void>;
}) => {
  const [modelUrl, setModelUrl] = useState("");
  const [isFromTFHub, setIsFromTFHub] = useState(false);
  const [urlError, setUrlError] = useState<string | undefined>();

  const verifySourceMatch = (url: string, isFromTFHub: boolean) => {
    if (isFromTFHub && !RemoteClassifier.verifyTFHubUrl(url)) {
      setUrlError("URL must point to TFHub");
      return;
    }

    setUrlError(undefined);
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

  return (
    <>
      <Typography gutterBottom>
        {"Upload a model from the internet."}
      </Typography>

      <FormGroup row sx={{ width: "100%", gap: 2 }}>
        <TextField
          variant={"standard"}
          id="web-upload-input-label"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LanguageIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flexGrow: 1 }}
          size={"small"}
          value={modelUrl}
          onChange={handleModelUrlChange}
          error={!!urlError}
          helperText={urlError ?? ""}
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
      </FormGroup>
      <Box sx={{ display: "flex", justifyContent: "flex-end", py: 1 }}>
        <Button
          onClick={() => onUploadModel(modelUrl, isFromTFHub)}
          color="primary"
          disabled={!!urlError || modelUrl.length === 0}
        >
          Load Model
        </Button>
      </Box>
    </>
  );
};
