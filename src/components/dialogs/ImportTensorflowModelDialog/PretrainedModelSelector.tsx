import React, { useEffect, useState } from "react";

import {
  DialogContent,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";

import { Model } from "utils/models/Model/Model";
import { range } from "lodash";

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
  const [modelIdxs, setModelIdxs] = useState<number[]>(
    range(-1, values.length)
  );
  const [selectedIdxVal, setSelectedIdxVal] = useState(initModel);

  useEffect(() => {
    setModelIdxs(range(-1, values.length));
  }, [values]);

  const handlePreTrainedModelChange = async (event: SelectChangeEvent) => {
    const idxVal = event.target.value;
    setSelectedIdxVal(idxVal);
    const idx = Number(idxVal);
    setModel(idx >= 0 ? values[idx] : undefined);
  };

  return (
    <>
      <DialogContent>
        <Typography gutterBottom>
          Choose from a provided pre-trained model
        </Typography>
      </DialogContent>
      <FormControl
        sx={{ width: "75%", ml: 2, pb: 2 }}
        size="small"
        error={error}
      >
        <InputLabel id="pretrained-select-label">Pre-trained Models</InputLabel>
        <Select
          labelId="pretrained-select-label"
          id="pretrained-simple-select"
          value={selectedIdxVal}
          label="Pre-trained Models"
          onChange={handlePreTrainedModelChange}
          error={error}
        >
          {modelIdxs.map((idx) => (
            <MenuItem key={`Pretrained-${idx}`} value={String(idx)}>
              {idx === -1 ? "None" : values[idx].name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{errorText}</FormHelperText>
      </FormControl>
    </>
  );
};
