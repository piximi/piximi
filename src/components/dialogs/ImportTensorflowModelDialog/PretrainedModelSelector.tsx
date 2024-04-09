import React, { useEffect, useState } from "react";

import {
  DialogContent,
  FormControl,
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
}: {
  values: Array<Model>;
  setModel: (model: Model | undefined) => void;
}) => {
  // const [errMessage, setErrMessage] = useState<string>("");
  const [modelIdxs, setModelIdxs] = useState<number[]>(
    range(-1, values.length)
  );
  const [selectedIdxVal, setSelectedIdxVal] = useState("-1");

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
      <MenuItem>
        <FormControl sx={{ width: "75%", ml: 2 }} size="small">
          <InputLabel id="pretrained-select-label">
            Pre-trained Models
          </InputLabel>
          <Select
            labelId="pretrained-select-label"
            id="pretrained-simple-select"
            value={selectedIdxVal}
            //value={selectedIdx === -1 ? "None" : String(values[selectedIdx])}
            label="Pre-trained Models"
            onChange={handlePreTrainedModelChange}
          >
            {modelIdxs.map((idx) => (
              <MenuItem key={`Pretrained-${idx}`} value={String(idx)}>
                {idx === -1 ? "None" : values[idx].name}
              </MenuItem>
            ))}
          </Select>
          {/* <Typography
            style={{
              whiteSpace: "pre-line",
              fontSize: "0.75rem",
              color: "red",
            }}
          >
            {errMessage}
          </Typography> */}
        </FormControl>
      </MenuItem>
    </>
  );
};
