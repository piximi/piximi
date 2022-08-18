import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Grid, TextField, Alert, Autocomplete } from "@mui/material";

import { CustomNumberTextField } from "components/common/InputFields";
import { StyledFormControl } from "components/common/StyledFormControl";

import {
  segmenterArchitectureOptionsSelector,
  segmenterUserUploadedModelSelector,
  segmenterInputShapeSelector,
  segmenterSlice,
} from "store/segmenter";

import { availableSegmenterModels, SegmenterModelProps } from "types";

export const SegmenterArchitectureSettingsGrid = () => {
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

  const dispatch = useDispatch();

  const modelOptions: SegmenterModelProps[] = availableSegmenterModels.slice();

  if (userUploadedModel) {
    modelOptions.push(userUploadedModel);
  }

  React.useEffect(() => {
    if (selectedModel.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.modelName} requires ${selectedModel.requiredChannels} channels!`
      );
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);

  const onSelectedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: SegmenterModelProps | null
  ) => {
    const selectedModel = value as SegmenterModelProps;
    setSelectedModel(selectedModel);

    // if the selected model requires a specific number of input channels, dispatch that number to the store
    if (selectedModel.requiredChannels) {
      dispatch(
        segmenterSlice.actions.updateSegmentationInputShape({
          inputShape: {
            ...inputShape,
            channels: selectedModel.requiredChannels,
          },
        })
      );
    }

    dispatch(
      segmenterSlice.actions.updateSelectedModel({ model: selectedModel })
    );
  };

  const dispatchRows = (height: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationInputShape({
        inputShape: { ...inputShape, height: height },
      })
    );
  };

  const dispatchCols = (cols: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationInputShape({
        inputShape: { ...inputShape, width: cols },
      })
    );
  };

  const dispatchChannels = (channels: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationInputShape({
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
            getOptionLabel={(option: SegmenterModelProps) => option.modelName}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoComplete="off"
                label="Model architecture"
              />
            )}
            value={selectedModel}
            isOptionEqualToValue={(option, value) =>
              option.modelType === value.modelType &&
              option.modelName === value.modelName
            }
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
          />
        </Grid>
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-cols"
            label="Input cols"
            value={inputShape.width}
            dispatchCallBack={dispatchCols}
            min={1}
          />
        </Grid>
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-channels"
            label="Input channels"
            value={inputShape.channels}
            dispatchCallBack={dispatchChannels}
            min={1}
            disabled={fixedNumberOfChannels}
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
