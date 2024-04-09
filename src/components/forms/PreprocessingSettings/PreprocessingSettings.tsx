import React from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  SelectChangeEvent,
} from "@mui/material";
import { CustomNumberTextField } from "../CustomNumberTextField";
import { CustomFormSelectField } from "../CustomFormSelectField";
import { CropOptions, RescaleOptions } from "utils/models/types";
import { CropSchema } from "utils/models/enums";

type PreprocessingSettingsProps = {
  cropOptions: CropOptions;
  rescaleOptions: RescaleOptions;
  updateCropOptions: (cropOptions: CropOptions) => void;
  updateRescaleOptions: (rescaleOptions: RescaleOptions) => void;
};

export const PreprocessingSettings = ({
  cropOptions,
  rescaleOptions,
  updateCropOptions,
  updateRescaleOptions,
}: PreprocessingSettingsProps) => {
  const [disabled, setDisabled] = React.useState<boolean>(
    !rescaleOptions.rescale
  );

  const [cropDisabled, setCropDisabled] = React.useState<boolean>(
    cropOptions.cropSchema === CropSchema.None
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
      </Grid>
    </Grid>
  );
};
