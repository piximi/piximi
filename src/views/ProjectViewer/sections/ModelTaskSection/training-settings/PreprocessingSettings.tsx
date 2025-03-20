import React from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
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

type PreprocessingSettingsProps = {
  cropOptions: CropOptions;
  rescaleOptions: RescaleOptions;
  updateCropOptions: (cropOptions: CropOptions) => void;
  updateRescaleOptions: (rescaleOptions: RescaleOptions) => void;
  trainingPercentage: number;
  dispatchTrainingPercentage: (trainingPercentage: number) => void;
  isModelTrainable: boolean;
  shuffleOptions: boolean;
  toggleShuffleOptions: () => void;
};

export const PreprocessingSettings = ({
  cropOptions,
  rescaleOptions,
  updateCropOptions,
  updateRescaleOptions,
  trainingPercentage,
  dispatchTrainingPercentage,
  isModelTrainable,
  shuffleOptions,
  toggleShuffleOptions,
}: PreprocessingSettingsProps) => {
  const [disabled, setDisabled] = React.useState<boolean>(
    !rescaleOptions.rescale,
  );

  const [cropDisabled, setCropDisabled] = React.useState<boolean>(
    cropOptions.cropSchema === CropSchema.None,
  );

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

  return (
    <Grid container spacing={2}>
      <Grid item xs={4} md={4} lg={4}>
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

        <FormControl size="small">
          <FormControlLabel
            control={
              <Checkbox
                checked={rescaleOptions.rescale}
                onChange={onCheckboxChange}
                name="rescale"
                color="primary"
              />
            }
            label="Rescale pixel intensities"
            disableTypography
          />
        </FormControl>
        <Stack>
          <Typography variant="body2" gutterBottom>
            What fraction of the labeled images should be used for training?
            (The rest is used for validation)
          </Typography>
          <CustomNumberTextField
            id="test-split"
            label="Train percentage"
            value={trainingPercentage}
            dispatchCallBack={dispatchTrainingPercentage}
            min={0}
            max={1}
            enableFloat={true}
            disabled={!isModelTrainable}
            width="15ch"
          />
          <Typography variant="body2" gutterBottom>
            Training/Validation Data Shuffling
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={shuffleOptions}
                onChange={toggleShuffleOptions}
                color="primary"
                disabled={!isModelTrainable}
              />
            }
            label="Shuffle on Split"
          />
        </Stack>
      </Grid>
    </Grid>
  );
};
