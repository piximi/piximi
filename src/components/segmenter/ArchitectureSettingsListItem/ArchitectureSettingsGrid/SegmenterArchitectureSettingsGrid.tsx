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

import { availableSegmenterModels } from "types/ModelType";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

export const SegmenterArchitectureSettingsGrid = () => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(segmenterModelSelector);
  const inputShape = useSelector(segmenterInputShapeSelector);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    useState<boolean>(false);

  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    useState<string>("");

  const modelOptions = availableSegmenterModels.filter((m) => m.trainable);

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
            isOptionEqualToValue={(option, value) => value.name === option.name}
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
