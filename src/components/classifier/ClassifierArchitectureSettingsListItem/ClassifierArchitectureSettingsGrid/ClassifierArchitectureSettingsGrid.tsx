import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Alert, Autocomplete, Grid, TextField } from "@mui/material";

import {
  CustomNumberTextField,
  StyledFormControl,
} from "components/common/styled-components";

import {
  classifierInputShapeSelector,
  classifierSelectedModelSelector,
  classifierSlice,
} from "store/classifier";

import { availableClassifierModels } from "types/ModelType";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";

export const ClassifierArchitectureSettingsGrid = () => {
  const dispatch = useDispatch();

  const inputShape = useSelector(classifierInputShapeSelector);
  const selectedModel = useSelector(classifierSelectedModelSelector);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    useState<boolean>(false);

  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    useState<string>("");

  // TOOD: why copy?
  const modelOptions = availableClassifierModels.slice();

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

  const onSelectedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: SequentialClassifier | null
  ) => {
    const _selectedModel = value as SequentialClassifier;

    // TODO - segmenter: probably towrad the end, resolve problem with select -> train -> select new ...
    dispatch(
      classifierSlice.actions.updateSelectedModel({ model: _selectedModel })
    );

    // if the selected model requires a specific number of input channels, dispatch that number to the store
    if (_selectedModel.requiredChannels) {
      dispatch(
        classifierSlice.actions.updateInputShape({
          inputShape: {
            ...inputShape,
            channels: _selectedModel.requiredChannels,
          },
        })
      );
    }
  };

  const dispatchRows = (height: number) => {
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, height: height },
      })
    );
  };

  const dispatchCols = (cols: number) => {
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, width: cols },
      })
    );
  };

  const dispatchChannels = (channels: number) => {
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, channels: channels },
      })
    );
  };

  return (
    <StyledFormControl>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <Autocomplete
            disableClearable={true}
            options={modelOptions}
            onChange={onSelectedModelChange}
            getOptionLabel={(option: SequentialClassifier) => option.name}
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
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-rows"
            label="Input rows"
            value={inputShape.height}
            dispatchCallBack={dispatchRows}
            min={1}
            disabled={!selectedModel.trainable}
          />
        </Grid>
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-cols"
            label="Input cols"
            value={inputShape.width}
            dispatchCallBack={dispatchCols}
            min={1}
            disabled={!selectedModel.trainable}
          />
        </Grid>
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-channels"
            label="Input channels"
            value={inputShape.channels}
            dispatchCallBack={dispatchChannels}
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
