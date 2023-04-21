import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Grid, TextField, Alert, Autocomplete } from "@mui/material";

import {
  CustomNumberTextField,
  StyledFormControl,
} from "components/common/styled-components";

import {
  segmenterModelSelector,
  segmenterInputShapeSelector,
  segmenterSlice,
} from "store/segmenter";

<<<<<<< HEAD
import { availableSegmenterModels } from "types/ModelType";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
import { availableSegmenterModels, SegmenterModelProps } from "types";

export const SegmenterArchitectureSettingsGrid = ({
  setIsModelPretrained,
  isModelPretrained,
}: {
  setIsModelPretrained: React.Dispatch<React.SetStateAction<boolean>>;
  isModelPretrained: boolean;
}) => {
  const architectureOptions = useSelector(segmenterArchitectureOptionsSelector);
  const userUploadedModel = useSelector(segmenterUserUploadedModelSelector);
  const inputShape = useSelector(segmenterInputShapeSelector);

  const [selectedModel, setSelectedModel] = React.useState<SegmenterModelProps>(
    architectureOptions.selectedModel
  );
  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    React.useState<boolean>(false);
  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    React.useState<string>("");
=======
import { availableSegmenterModels, SegmenterModelProps } from "types";
import { ModelArchitecture } from "types/ModelType";

export const SegmenterArchitectureSettingsGrid = ({
  setIsModelPretrained,
  isModelPretrained,
}: {
  setIsModelPretrained: React.Dispatch<React.SetStateAction<boolean>>;
  isModelPretrained: boolean;
}) => {
  const architectureOptions = useSelector(segmenterArchitectureOptionsSelector);
  const userUploadedModel = useSelector(segmenterUserUploadedModelSelector);
  const inputShape = useSelector(segmenterInputShapeSelector);

  const [selectedModel, setSelectedModel] = React.useState<SegmenterModelProps>(
    architectureOptions.selectedModel
  );
  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    React.useState<boolean>(false);
  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    React.useState<string>("");
>>>>>>> aea4e5ca ([mod] Add model architecture to type)

export const SegmenterArchitectureSettingsGrid = () => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(segmenterModelSelector);
  const inputShape = useSelector(segmenterInputShapeSelector);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    useState<boolean>(false);

  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    useState<string>("");

  const modelOptions = availableSegmenterModels.slice();

  const onSelectedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: Segmenter | null
  ) => {
    const _selectedModel = value as Segmenter;

    dispatch(
      segmenterSlice.actions.updateSelectedModel({ model: _selectedModel })
    );

    // if the selected model requires a specific number of input channels, dispatch that number to the store
    if (_selectedModel.requiredChannels) {
      dispatch(
        segmenterSlice.actions.updateSegmentationInputShape({
          inputShape: {
            ...inputShape,
            channels: _selectedModel.requiredChannels,
          },
        })
      );
    }
  };

  const dispatchShape = (value: number, inputID: string) => {
    switch (inputID) {
      case "shape-rows":
        dispatch(
          segmenterSlice.actions.updateSegmentationInputShape({
            inputShape: { ...inputShape, height: value },
          })
        );
        return;
      case "shape-cols":
        dispatch(
          segmenterSlice.actions.updateSegmentationInputShape({
            inputShape: { ...inputShape, width: value },
          })
        );
        return;
      case "shape-channels":
        dispatch(
          segmenterSlice.actions.updateSegmentationInputShape({
            inputShape: { ...inputShape, channels: value },
          })
        );
    }
  };

  useEffect(() => {
    if (selectedModel.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.name} requires ${selectedModel.requiredChannels} channels!`
      );
<<<<<<< HEAD
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
    } else if (selectedModel.modelArch && selectedModel.modelArch === "graph") {
      setIsModelPretrained(true);
=======
    } else if (selectedModel.modelArch === ModelArchitecture.Graph) {
      setIsModelPretrained(true);
>>>>>>> aea4e5ca ([mod] Add model architecture to type)
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);

  return (
    <StyledFormControl>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <Autocomplete
            disableClearable={true}
            options={modelOptions}
            onChange={onSelectedModelChange}
            getOptionLabel={(option: Segmenter) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoComplete="off"
                label="Model architecture"
              />
            )}
            value={selectedModel}
<<<<<<< HEAD
            isOptionEqualToValue={(option, value) => value.name === option.name}
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
            isOptionEqualToValue={(option, value) =>
              option.modelType === value.modelType &&
              option.modelName === value.modelName
            }
=======
            isOptionEqualToValue={(option, value) =>
              option.theModel === value.theModel &&
              option.modelName === value.modelName
            }
>>>>>>> aea4e5ca ([mod] Add model architecture to type)
          />
        </Grid>
      </Grid>
      <Grid container direction={"row"} spacing={2}>
        <Grid item xs={2}>
          <CustomNumberTextField
            id="shape-rows"
            label="Input rows"
            value={inputShape.height}
            dispatchCallBack={dispatchShape}
            min={1}
            disabled={!selectedModel.trainable}
          />
        </Grid>
        <Grid item xs={2}>
          <CustomNumberTextField
            id="shape-cols"
            label="Input cols"
            value={inputShape.width}
            dispatchCallBack={dispatchShape}
            min={1}
            disabled={!selectedModel.trainable}
          />
        </Grid>
        <Grid item xs={2}>
          <CustomNumberTextField
            id="shape-channels"
            label="Input channels"
            value={inputShape.channels}
            dispatchCallBack={dispatchShape}
            min={1}
            disabled={fixedNumberOfChannels || !selectedModel.trainable}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1}>
        <Grid item xs={3} marginTop={1}>
          {fixedNumberOfChannels && (
            <Alert severity="info">{fixedNumberOfChannelsHelperText}</Alert>
          )}
        </Grid>
      </Grid>
    </StyledFormControl>
  );
};
