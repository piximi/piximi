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

import { ModelArchitecture, Shape } from "types";
import { loadStardist } from "utils/common/models";

export const PretrainedModelSelector = ({
  values,
  setSegmentationModel,
  setInputShape,
  setModelName,
  setModelArch,
}: {
  values: Array<{ name: string; modelArch: ModelArchitecture }>;
  setSegmentationModel: React.Dispatch<
    React.SetStateAction<
      LayersModel | GraphModel<string | io.IOHandler> | undefined
    >
  >;
  setInputShape: React.Dispatch<React.SetStateAction<Shape>>;
  setModelName: React.Dispatch<React.SetStateAction<string>>;
  setModelArch: React.Dispatch<React.SetStateAction<ModelArchitecture>>;
}) => {
  const [errMessage, setErrMessage] = useState<string>("");
  const [selectedPreTrainedModel, setSelectedPreTrainedModel] =
    useState<number>(ModelArchitecture.None);

  const handlePreTrainedModelChange = async (event: SelectChangeEvent) => {
    setSelectedPreTrainedModel(Number(event.target.value));
    setModelArch(Number(event.target.value));
    await loadModel(Number(event.target.value));
  };

  const loadModel = async (selectedPreTrainedModel: number) => {
    if (selectedPreTrainedModel === ModelArchitecture.StardistVHE) {
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

        setModelName(ModelArchitecture[selectedPreTrainedModel]);
      } catch (err) {
        const error: Error = err as Error;
        setErrMessage(error.message);
      }
    } else if (selectedPreTrainedModel === ModelArchitecture.CocoSSD) {
      // const model = await loadCocoSSD();
      // const modelShape = model.inputs[0].shape!.slice(1) as number[];
      // setInputShape((prevShape) => ({
      //   ...prevShape,
      //   height: modelShape[0],
      //   width: modelShape[1],
      //   channels: modelShape[2],
      // }));
      // setSegmentationModel(undefined);
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
              <MenuItem
                key={`Pretrained-${model.modelArch}`}
                value={model.modelArch}
              >
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
