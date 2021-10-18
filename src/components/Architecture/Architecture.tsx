import { Grid, MenuItem, TextField } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { architectureOptionsSelector } from "../../store/selectors/architectureOptionsSelector";

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
            {architectureOptions.modelName}
          </MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={3}>
        <TextField
          fullWidth
          helperText="&nbsp;"
          id="version"
          label="Version"
          select
          value={architectureOptions.modelVersion}
        >
          <MenuItem disabled value={architectureOptions.modelVersion}>
            {architectureOptions.modelVersion}
          </MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={3}>
        <TextField
          fullWidth
          helperText="&nbsp;"
          id="multiplier"
          label="Multiplier"
          select
          value={architectureOptions.modelMultiplier}
        >
          <MenuItem disabled value={architectureOptions.modelMultiplier}>
            {architectureOptions.modelMultiplier}
          </MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );
};
