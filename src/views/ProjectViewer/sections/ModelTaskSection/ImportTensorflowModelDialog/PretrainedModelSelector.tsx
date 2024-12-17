import React, { useMemo, useState } from "react";

import {
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from "@mui/material";

import { Model } from "utils/models/Model";
import { modelInfo } from "utils/models/segmentation";

interface ModelOptionType {
  label: string;
  id: number;
}

//github.com/twpkevin06222/Gland-Segmentation/tree/main
export const PretrainedModelSelector = ({
  values,
  setModel,
  error,
  errorText,
  initModel = "-1",
}: {
  values: Array<Model>;
  setModel: (model: Model | undefined) => void;
  error?: boolean;
  errorText?: string;
  initModel: string;
}) => {
  const modelOptions: ModelOptionType[] = useMemo(() => {
    return values.map((value, idx) => ({ label: value.name, id: idx }));
  }, [values]);
  const [selectedModel, setSelectedModel] = useState<ModelOptionType | null>(
    modelOptions[+initModel] ?? null,
  );

  const handlePreTrainedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: ModelOptionType | null,
  ) => {
    setSelectedModel(newValue ? modelOptions[newValue.id] : null);
    setModel(newValue ? values[newValue.id] : undefined);
  };

  return (
    <React.Fragment>
      <Typography gutterBottom sx={{ pb: 2 }}>
        Choose from a provided pre-trained model:
      </Typography>
      <FormControl sx={{ width: "75%", pb: 2 }} size="small" error={error}>
        <Autocomplete
          id="pre-trained-model-select"
          options={modelOptions}
          value={selectedModel}
          onChange={handlePreTrainedModelChange}
          sx={{ width: 300, mx: "auto" }}
          renderInput={(params) => (
            <TextField {...params} label="Pre-trained Models" />
          )}
          blurOnSelect
          openOnFocus
          size="small"
        />

        <FormHelperText sx={{ mx: "auto" }}>{errorText ?? " "}</FormHelperText>
      </FormControl>
      <ModelInfo selectedModel={selectedModel} />
    </React.Fragment>
  );
};

const ModelInfo = ({
  selectedModel,
}: {
  selectedModel: ModelOptionType | null;
}) => {
  return selectedModel ? (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gridColumnGap: 8,
      }}
    >
      {Object.entries(modelInfo[selectedModel.label]).map(([key, value]) => (
        <React.Fragment key={key}>
          <Typography variant="caption" color="textSecondary">
            {key[0].toUpperCase() + key.slice(1)}:
          </Typography>
          {Array.isArray(value) ? (
            <Typography
              variant="caption"
              color="textSecondary"
              key={key + "-value"}
            >
              {value.map((src, index) => (
                <React.Fragment key={src.text}>
                  <Link className="source_link" href={src.url}>
                    {src.text}
                  </Link>
                  {index < value.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </Typography>
          ) : (
            <Typography variant="caption" color="textSecondary">
              {typeof value === "string" ? value : value.name}
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  ) : (
    <></>
  );
};
