import React from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

export const InputShape = () => {
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
          value={224}
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
          value={224}
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
          helperText="Color depth"
          label="&nbsp;"
          value={3}
        />
      </Grid>
    </Grid>
  );
};
