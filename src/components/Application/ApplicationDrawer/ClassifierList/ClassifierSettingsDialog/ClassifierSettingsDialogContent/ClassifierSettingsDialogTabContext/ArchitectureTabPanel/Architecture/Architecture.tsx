import React from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";

export const Architecture = () => {
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
            MobileNet
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
          value={"1"}
        >
          <MenuItem disabled value={"1"}>
            1
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
          value={"1.3"}
        >
          <MenuItem disabled value={"1.3"}>
            1.3
          </MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );
};
