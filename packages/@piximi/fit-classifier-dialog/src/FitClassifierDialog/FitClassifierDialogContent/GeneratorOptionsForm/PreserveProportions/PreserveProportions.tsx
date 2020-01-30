import Grid from "@material-ui/core/Grid";
import * as React from "react";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

type PreserveProportionsProps = {};

export const PreserveProportions = ({}: PreserveProportionsProps) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs>
        <FormControlLabel
          control={<Switch checked />}
          label="Preserve proportions"
          value="preserve-proportions"
        />
      </Grid>
    </Grid>
  );
};
