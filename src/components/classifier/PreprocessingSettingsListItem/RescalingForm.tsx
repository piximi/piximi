import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Checkbox,
  FormControlLabel,
  Grid,
  styled,
  Typography,
} from "@mui/material";

import { rescaleOptionsSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

export const RescalingForm = () => {
  const rescaleOptions = useSelector(rescaleOptionsSelector);

  const dispatch = useDispatch();

  const [disabled, setDisabled] = React.useState<boolean>(
    !rescaleOptions.rescale
  );

  const onCheckboxChange = () => {
    setDisabled(!disabled);
    dispatch(
      classifierSlice.actions.updateRescaleOptions({
        rescaleOptions: { ...rescaleOptions, rescale: !rescaleOptions.rescale },
      })
    );
  };

  const StyledForm = styled("form")({
    // width: '100%',
    display: "flex",
    flexWrap: "wrap",
  });

  return (
    <>
      <Typography id="rescaling" gutterBottom>
        Pixel Intensity Rescaling
      </Typography>

      <StyledForm noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rescaleOptions.rescale}
                  onChange={onCheckboxChange}
                  name="rescale"
                  color="primary"
                />
              }
              label="Rescale pixels"
            />
          </Grid>
        </Grid>
      </StyledForm>
    </>
  );
};
