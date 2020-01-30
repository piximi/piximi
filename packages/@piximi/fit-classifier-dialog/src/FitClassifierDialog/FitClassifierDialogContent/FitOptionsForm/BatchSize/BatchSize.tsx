import Grid from "@material-ui/core/Grid";
import * as React from "react";
import TextField from "@material-ui/core/TextField";

type BatchSizeProps = {};

export const BatchSize = ({}: BatchSizeProps) => {
  return (
    <TextField
      fullWidth
      id="batch-size"
      label="Batch size"
      onChange={() => {}}
      value={32}
    />
  );
};
