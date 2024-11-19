import React, { useMemo, useState } from "react";

import {
  Autocomplete,
  FormControl,
  FormHelperText,
  TextField,
  Typography,
} from "@mui/material";

import { Model } from "utils/models/Model";

interface ModelOptionType {
  label: string;
  id: number;
}
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
    modelOptions[+initModel] ?? null
  );

  const handlePreTrainedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: ModelOptionType | null
  ) => {
    setSelectedModel(newValue ? modelOptions[newValue.id] : null);
    setModel(newValue ? values[newValue.id] : undefined);
  };

  return (
    <>
      <Typography gutterBottom sx={{ pb: 2 }}>
        Choose from a provided pre-trained model
      </Typography>
      <FormControl
        sx={{ width: "75%", ml: 2, pb: 2 }}
        size="small"
        error={error}
      >
        <Autocomplete
          id="pre-trained-model-select"
          options={modelOptions}
          value={selectedModel}
          onChange={handlePreTrainedModelChange}
          sx={{ width: 300 }}
          // eslint-disable-next-line react/jsx-no-undef
          renderInput={(params) => (
            <TextField {...params} label="Pre-trained Models" />
          )}
          blurOnSelect
          openOnFocus
          size="small"
        />

        <FormHelperText>{errorText ?? " "}</FormHelperText>
      </FormControl>
    </>
  );
};
