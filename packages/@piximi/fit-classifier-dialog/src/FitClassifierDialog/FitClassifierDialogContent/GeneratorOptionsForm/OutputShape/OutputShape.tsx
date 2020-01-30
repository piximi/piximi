import Grid from "@material-ui/core/Grid";
import * as React from "react";
import TextField from "@material-ui/core/TextField";

type OutputShapeProps = {};

export const OutputShape = ({}: OutputShapeProps) => {
  return (
    <>
      <Grid item xs={2}>
        <TextField
          fullWidth
          id="output-shape-width"
          label="Output shape"
          onChange={() => {}}
          value={224}
        />
      </Grid>

      <Grid item xs={2}>
        <TextField
          fullWidth
          id="output-shape-height"
          label="&nbsp;"
          onChange={() => {}}
          value={224}
        />
      </Grid>
    </>
  );
};
