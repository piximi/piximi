import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Grid, TextField, Alert, Autocomplete } from "@mui/material";

import { CustomNumberTextField, StyledFormControl } from "../";

import {
  selectSegmenterModelIdx,
  selectSegmenterInputShape,
  segmenterSlice,
} from "store/segmenter";

import { availableSegmenterModels } from "types/ModelType";

type ArchitectureSettingsProps = {
  onModelSelect: (modelIdx: number) => void;
};

export const SegmenterArchitectureSettingsGrid = ({
  onModelSelect,
}: ArchitectureSettingsProps) => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(selectSegmenterModelIdx);
  const inputShape = useSelector(selectSegmenterInputShape);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    useState<boolean>(false);

  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    useState<string>("");

  const modelOptions = useMemo(
    () =>
      availableSegmenterModels
        .map((m, i) => ({
          name: m.name,
          trainable: m.trainable,
          loaded: m.modelLoaded,
          idx: i,
        }))
        .filter((m) => m.trainable || m.loaded),
    []
  );

  useEffect(() => {
    if (selectedModel.model.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.model.name} requires ${selectedModel.model.requiredChannels} channels!`
      );
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);

  const onSelectedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    modelOption: (typeof modelOptions)[number] | null
  ) => {
    if (!modelOption) return;
    onModelSelect(modelOption.idx);
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

  return (
    <StyledFormControl>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <Autocomplete
            disableClearable={true}
            options={modelOptions}
            onChange={onSelectedModelChange}
            getOptionLabel={(option) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoComplete="off"
                label="Model architecture"
              />
            )}
            value={{
              name: selectedModel.model.name,
              trainable: selectedModel.model.trainable,
              loaded: selectedModel.model.modelLoaded,
              idx: selectedModel.idx,
            }}
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
            disabled={!selectedModel.model.trainable}
          />
        </Grid>
        <Grid item xs={2}>
          <CustomNumberTextField
            id="shape-cols"
            label="Input cols"
            value={inputShape.width}
            dispatchCallBack={dispatchShape}
            min={1}
            disabled={!selectedModel.model.trainable}
          />
        </Grid>
        <Grid item xs={2}>
          <CustomNumberTextField
            id="shape-channels"
            label="Input channels"
            value={inputShape.channels}
            dispatchCallBack={dispatchShape}
            min={1}
            disabled={fixedNumberOfChannels || !selectedModel.model.trainable}
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
