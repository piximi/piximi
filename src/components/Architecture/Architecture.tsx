import React from "react";
import { useSelector } from "react-redux";

import { Grid, MenuItem, TextField } from "@mui/material";

import { architectureOptionsSelector } from "store/selectors";

export const Architecture = () => {
  const architectureOptions = useSelector(architectureOptionsSelector);

  return (
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          helperText="&nbsp;"
          id="architecture"
          label="Architecture"
          select
          value={"MobileNet"}
        >
          <MenuItem disabled value={"MobileNet"}>
            {architectureOptions.selectedModel.modelName}
          </MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );
};
