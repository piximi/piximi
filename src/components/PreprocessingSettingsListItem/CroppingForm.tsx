import * as React from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
  styled,
  Typography,
  FormHelperText,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { cropOptionsSelector } from "../../store/selectors";
import { CropSchema } from "types/CropOptions";
import { StyledFormControl } from "components/FitClassifierDialog/StyledFormControl";
import { enumKeys } from "utils/enumKeys";
import { CustomNumberTextField } from "components/CustomNumberTextField/CustomNumberTextField";

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

      {/* <StyledForm noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={enabled}
                  onChange={onCheckboxChange}
                  name="rescale"
                  color="primary"
                />
              }
              label="Crop images"
            />
          </Grid>
        </Grid>
      </StyledForm> */}
    </>
  );
};
