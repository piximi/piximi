import React, { useEffect } from "react";
import {
  Alert,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";

import {
  CustomNumberTextField,
  CustomFormSelectField,
} from "components/inputs";

import { CropSchema } from "utils/models/enums";

import { CropOptions, RescaleOptions } from "utils/models/types";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveClassifierCropOptions,
  selectActiveClassifierInputShape,
  selectActiveClassifierModelWithIdx,
  selectActiveClassifierRescaleOptions,
  selectActiveClassifierShuffleOptions,
  selectActiveClassifierTrainingPercentage,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { classifierSlice } from "store/classifier";

type PreprocessingSettingsProps = {
  trainable: boolean;
};

export const ClassifierPreprocessingSettings = ({
  trainable,
}: PreprocessingSettingsProps) => {
  const dispatch = useDispatch();
  const cropOptions = useSelector(selectActiveClassifierCropOptions);
  const rescaleOptions = useSelector(selectActiveClassifierRescaleOptions);
  const activeKindId = useSelector(selectActiveKindId);
  const shuffleOptions = useSelector(selectActiveClassifierShuffleOptions);
  const inputShape = useSelector(selectActiveClassifierInputShape);
  const selectedModel = useSelector(selectActiveClassifierModelWithIdx);
  const trainingPercentage = useSelector(
    selectActiveClassifierTrainingPercentage,
  );

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    React.useState<boolean>(false);
  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    React.useState<string>("");

  const [disabled, setDisabled] = React.useState<boolean>(
    !rescaleOptions.rescale,
  );

  const [cropDisabled, setCropDisabled] = React.useState<boolean>(
    cropOptions.cropSchema === CropSchema.None,
  );

  const dispatchTrainingPercentage = (trainingPercentage: number) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { trainingPercentage },
        kindId: activeKindId,
      }),
    );
  };

  const toggleShuffleOptions = () => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { shuffle: shuffleOptions },
        kindId: activeKindId,
      }),
    );
  };

  const updateCropOptions = (cropOptions: CropOptions) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { cropOptions },
        kindId: activeKindId,
      }),
    );
  };

  const updateRescaleOptions = (rescaleOptions: RescaleOptions) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { rescaleOptions },
        kindId: activeKindId,
      }),
    );
  };

  const dispatchNumCrops = (numCrops: number) => {
    updateCropOptions({ ...cropOptions, numCrops });
  };

  const onCropSchemaChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const cropSchema = target.value as CropSchema;

    if (cropSchema === CropSchema.None) {
      setCropDisabled(true);
      updateCropOptions({ numCrops: 1, cropSchema });
    } else {
      setCropDisabled(false);
      updateCropOptions({ ...cropOptions, cropSchema });
    }
  };

  const onCheckboxChange = () => {
    setDisabled(!disabled);
    updateRescaleOptions({
      ...rescaleOptions,
      rescale: !rescaleOptions.rescale,
    });
  };
  const dispatchShape = (value: number, inputID: string) => {
    switch (inputID) {
      case "shape-rows":
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, height: value },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-cols":
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, width: value },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-channels":
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, channels: value },
            kindId: activeKindId,
          }),
        );
    }
  };

  useEffect(() => {
    if (selectedModel.model && selectedModel.model.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.model.name} requires ${selectedModel.model.requiredChannels} channels!`,
      );
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);

  return (
    <Grid container spacing={2} padding={2}>
      <Grid
        size={12}
        sx={{
          px: 2,
        }}
      >
        <Typography variant="body2">Cropping</Typography>
        <Stack>
          <CustomFormSelectField
            keySource={CropSchema}
            value={cropOptions.cropSchema}
            onChange={onCropSchemaChange}
            helperText="Crop Type"
          />
          <CustomNumberTextField
            id="num-crops"
            label="Number of Crops"
            disabled={cropDisabled}
            value={cropOptions.numCrops}
            dispatchCallBack={dispatchNumCrops}
            min={1}
          />
        </Stack>
      </Grid>

      <Grid
        size={12}
        sx={{
          px: 2,
        }}
      >
        <Typography variant="body2">Split Training/Validation</Typography>
        <CustomNumberTextField
          id="test-split"
          label="Train percentage"
          value={trainingPercentage}
          dispatchCallBack={dispatchTrainingPercentage}
          min={0}
          max={1}
          enableFloat={true}
          disabled={!trainable}
          width="15ch"
        />
      </Grid>
      <Grid
        size={12}
        sx={{
          px: 2,
        }}
      >
        <Stack>
          <Typography variant="body2">Input Shape</Typography>
          <Box
            display="flex"
            flex-direction="row"
            justifyContent="space-between"
          >
            <CustomNumberTextField
              id="shape-rows"
              label="Rows"
              value={inputShape.height}
              dispatchCallBack={(number) => dispatchShape(number, "shape-rows")}
              min={1}
              disabled={selectedModel.model && !selectedModel.model.trainable}
              width="12ch"
            />
            <CustomNumberTextField
              id="shape-cols"
              label="Columns"
              value={inputShape.width}
              dispatchCallBack={(number) => dispatchShape(number, "shape-cols")}
              min={1}
              disabled={selectedModel.model && !selectedModel.model.trainable}
              width="12ch"
            />
            <CustomNumberTextField
              id="shape-channels"
              label="Channels"
              value={inputShape.channels}
              dispatchCallBack={(number) =>
                dispatchShape(number, "shape-channels")
              }
              min={1}
              disabled={
                fixedNumberOfChannels ||
                (selectedModel.model && !selectedModel.model.trainable)
              }
              width="12ch"
            />
          </Box>

          {fixedNumberOfChannels && (
            <Alert severity="info">{fixedNumberOfChannelsHelperText}</Alert>
          )}
        </Stack>
      </Grid>
      <Grid
        size={12}
        sx={{
          px: 2,
        }}
      >
        <FormControl
          fullWidth
          size="small"
          sx={{ flexDirection: "row", justifyContent: "space-evenly" }}
        >
          <FormControlLabel
            sx={(theme) => ({ fontSize: theme.typography.body2.fontSize })}
            control={
              <Checkbox
                checked={rescaleOptions.rescale}
                onChange={onCheckboxChange}
                name="rescale"
                color="primary"
                size="small"
              />
            }
            label="Rescale pixel intensities"
            disableTypography
          />
          <FormControlLabel
            sx={(theme) => ({ fontSize: theme.typography.body2.fontSize })}
            control={
              <Checkbox
                checked={shuffleOptions}
                onChange={toggleShuffleOptions}
                color="primary"
                disabled={!trainable}
              />
            }
            label="Shuffle on Split"
            disableTypography
          />
        </FormControl>
      </Grid>
    </Grid>
  );
};
