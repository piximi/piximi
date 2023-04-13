import React, { useState } from "react";
import { LayersModel, io, GraphModel } from "@tensorflow/tfjs";

import {
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";

import { ModelType, Shape } from "types";
import { loadStardist } from "utils/common/model-loaders";

export const PretrainedModelSelector = ({
  values,
  setSegmentationModel,
  setInputShape,
  setModelName,
  setModelType,
}: {
  values: Array<{ name: string; type: ModelType }>;
  setSegmentationModel: React.Dispatch<
    React.SetStateAction<
      LayersModel | GraphModel<string | io.IOHandler> | undefined
    >
  >;
  setInputShape: React.Dispatch<React.SetStateAction<Shape>>;
  setModelName: React.Dispatch<React.SetStateAction<string>>;
  setModelType: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [errMessage, setErrMessage] = useState<string>("");
  const [selectedPreTrainedModel, setSelectedPreTrainedModel] =
    useState<number>(ModelType.None);

  const handlePreTrainedModelChange = async (event: SelectChangeEvent) => {
    setSelectedPreTrainedModel(Number(event.target.value));
    setModelType(Number(event.target.value));
    await loadModel(Number(event.target.value));
  };

  const loadModel = async (selectedPreTrainedModel: number) => {
    if (selectedPreTrainedModel === ModelType.StardistVHE) {
      try {
        const model = await loadStardist();
        setSegmentationModel(model);

        const modelShape = model.inputs[0].shape!.slice(1) as number[];

        setInputShape((prevShape) => ({
          ...prevShape,
          height: modelShape[0],
          width: modelShape[1],
          channels: modelShape[2],
        }));

        setModelName(ModelType[selectedPreTrainedModel]);
      } catch (err) {
        const error: Error = err as Error;
        setErrMessage(error.message);
      }
    }
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
            value={String(selectedPreTrainedModel)}
            label="Pre-trained Models"
            onChange={handlePreTrainedModelChange}
          >
            {values.map((model) => (
              <MenuItem key={`Pretrained-${model.type}`} value={model.type}>
                {model.name}
              </MenuItem>
            ))}
          </Select>
          <Typography
            style={{
              whiteSpace: "pre-line",
              fontSize: "0.75rem",
              color: "red",
            }}
          >
            {errMessage}
          </Typography>
        </FormControl>
      </MenuItem>
    </>
  );
};
