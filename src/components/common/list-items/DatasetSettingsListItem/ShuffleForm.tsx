import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Checkbox,
  FormControlLabel,
  Grid,
  styled,
  Typography,
} from "@mui/material";

import {
  classifierShuffleOptionsSelector,
  classifierSlice,
} from "store/classifier";

export const ShuffleForm = ({
  isModelPretrained,
}: {
  isModelPretrained?: boolean;
}) => {
  const shuffle = useSelector(classifierShuffleOptionsSelector);

  const dispatch = useDispatch();

  const onCheckboxChange = () => {
    dispatch(
      classifierSlice.actions.updateShuffleOptions({
        shuffle: !shuffle,
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
      <Typography id="shuffle" gutterBottom>
        Training/Validation Data Shuffling
      </Typography>

      <StyledForm noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={shuffle}
                  onChange={onCheckboxChange}
                  name="rescale"
                  color="primary"
                  disabled={isModelPretrained}
                />
              }
              label="shuffle on split"
            />
          </Grid>
        </Grid>
      </StyledForm>
    </>
  );
};
