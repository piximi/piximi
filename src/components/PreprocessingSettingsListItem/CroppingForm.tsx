import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Grid,
  Typography,
  FormHelperText,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";

import { StyledFormControl } from "components/FitClassifierDialog/StyledFormControl";

import { CustomNumberTextField } from "components/common/CustomNumberTextField/CustomNumberTextField";

import { cropOptionsSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

import { CropSchema } from "types";

import { enumKeys } from "utils";

export const CroppingForm = () => {
  const cropOptions = useSelector(cropOptionsSelector);

  const dispatch = useDispatch();

  const [cropDisabled, setCropDisabled] = React.useState<boolean>(
    cropOptions.cropSchema === CropSchema.None
  );

  const dispatchNumCrops = (numCrops: number) => {
    dispatch(
      classifierSlice.actions.updateCropOptions({
        cropOptions: { ...cropOptions, numCrops },
      })
    );
  };

  const onCropSchemaChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const cropSchema = target.value as CropSchema;

    if (cropSchema === CropSchema.None) {
      setCropDisabled(true);

      dispatch(
        classifierSlice.actions.updateCropOptions({
          cropOptions: { numCrops: 1, cropSchema },
        })
      );
    } else {
      setCropDisabled(false);

      dispatch(
        classifierSlice.actions.updateCropOptions({
          cropOptions: { ...cropOptions, cropSchema },
        })
      );
    }
  };

  return (
    <>
      <Typography id="cropping" gutterBottom>
        Cropping
      </Typography>

      <StyledFormControl>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Crop Type</FormHelperText>
            <Select
              value={cropOptions.cropSchema}
              onChange={onCropSchemaChange}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
              sx={(theme) => ({
                flexBasis: 300,
                width: "100%",
                marginRight: theme.spacing(1),
                marginTop: theme.spacing(0),
              })}
            >
              {enumKeys(CropSchema).map((k) => {
                return (
                  <MenuItem key={k} value={CropSchema[k]}>
                    {CropSchema[k]}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <CustomNumberTextField
              id="num-crops"
              label="Number of Crops"
              disabled={cropDisabled}
              value={cropOptions.numCrops}
              dispatchCallBack={dispatchNumCrops}
              min={1}
            />
          </Grid>
        </Grid>
      </StyledFormControl>
    </>
  );
};
