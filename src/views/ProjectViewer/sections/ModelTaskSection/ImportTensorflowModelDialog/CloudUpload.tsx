import type React from "react";
import { useState } from "react";

import {
  Box,
  Button,
  FormGroup,
  FormLabel,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Language as LanguageIcon } from "@mui/icons-material";

export const RemoteClassifierUpload = ({
  onUploadModel,
}: {
  onUploadModel: (modelUrl: string) => Promise<void>;
}) => {
  const [modelUrl, setModelUrl] = useState("");

  const handleModelUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModelUrl(event.target.value);
  };

  return (
    <>
      <Typography gutterBottom>
        {"Upload a model from the internet."}
      </Typography>

      <FormGroup row sx={{ width: "100%", gap: 2 }}>
        <FormLabel
          sx={{
            fontWeight: "bold",
            textTransform: "uppercase",
            fontSize: "0.875rem",
            textAnchor: "end",
            alignSelf: "center",
          }}
        >
          Model Url
        </FormLabel>
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
        />
      </FormGroup>
      <Box sx={{ display: "flex", justifyContent: "flex-end", py: 1 }}>
        <Button
          onClick={() => onUploadModel(modelUrl)}
          color="primary"
          disabled={modelUrl.length === 0}
        >
          Load Model
        </Button>
      </Box>
    </>
  );
};
