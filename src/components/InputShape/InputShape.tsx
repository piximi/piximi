import React from "react";
import { architectureOptionsSelector } from "../../store/selectors/architectureOptionsSelector";
import { useSelector } from "react-redux";
import { Grid, InputAdornment, TextField } from "@mui/material";

export const InputShape = () => {
  const inputShape = useSelector(architectureOptionsSelector).inputShape;

  return (
    <Grid container spacing={3}>
      <Grid item xs={3}>
        <TextField
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">pixels</InputAdornment>
            ),
          }}
          disabled
          helperText="Image height"
          label="Input shape"
          value={inputShape.r}
        />
      </Grid>

      <Grid item xs={3}>
        <TextField
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">pixels</InputAdornment>
            ),
          }}
          disabled
          helperText="Image width"
          label="&nbsp;"
          value={inputShape.c}
        />
      </Grid>

      <Grid item xs={3}>
        <TextField
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">channels</InputAdornment>
            ),
          }}
          disabled
          helperText="Color depth"
          label="&nbsp;"
          value={inputShape.channels}
        />
      </Grid>
    </Grid>
  );
};
